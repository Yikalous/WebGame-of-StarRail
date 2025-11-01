(function () {
    // ===== 角色模板 =====
    const FangsuanTemplate = {
        name: "荒弥",
        type: "ally",
        maxHp: 3000,
        attack: 3271,
        defense: 800,
        speed: 170,
        critRate: 0.7,
        critDamage: 0.8,
        maxPoint: 5,
        icon: "🧙",
        skills: [
            {
                name: "普通攻击",
                description: "对敌方主目标造成虚数伤害并附加易伤",
                targetType: TargetType.SINGLE,
                skillType: SkillType.BASIC,
                damageType: DamageType.IMAGINARY,
                tags: [SkillTag.ATTACK, SkillTag.SINGLE_TARGET],
                icon: "⚔️",
                PointCost: -4,
                executeFunc: function (user, target, allCharacters) {
                    const enemies = allCharacters.filter(c => c.type === 'enemy' && c.currentHp > 0);
                    const actualTarget = target || (enemies.length > 0 ? enemies[0] : null);

                    if (actualTarget) {
                        actualTarget.addStatusEffect("易伤", "damageTakenBonus", 0.3, 1, 'self', 'end');
                        user.Attack("SINGLE", "attack", [1100], [3.0], actualTarget, DamageType.IMAGINARY);
                    } else {
                        user.Log("没有可攻击的目标", 'debuff');
                    }
                }
            },
            {
                name: "决斗",
                description: "对一名敌方目标发起决斗，若自身速度高于敌方速度，则可以立即再次行动一次，同时速度减少10点，对友方最高速单位提速十点。若自身速度低于敌方速度，则有50%概率眩晕敌方。",
                targetType: TargetType.SINGLE,
                skillType: SkillType.SKILL,
                damageType: DamageType.IMAGINARY,
                tags: [SkillTag.ATTACK, SkillTag.SINGLE_TARGET, SkillTag.CONTROL],
                icon: "⚰️",
                filter: null,  // 移除限制，决斗技能可以随时使用
                PointCost: 1,
                executeFunc: function (user, target, allCharacters) {
                    const enemies = allCharacters.filter(c => c.type === 'enemy' && c.currentHp > 0);
                    const actualTarget = target || (enemies.length > 0 ? enemies[0] : null);
                    
                    if (!actualTarget) {
                        user.Log("没有可攻击的目标", 'debuff');
                        return;
                    }
                    
                    // 计算实际速度（基础速度 + 状态效果的速度加成）
                    let userActualSpeed = user.speed;
                    let targetActualSpeed = actualTarget.speed;
                    
                    user.statusEffects.forEach(effect => {
                        if (effect.speedBonus) userActualSpeed += effect.speedBonus;
                    });
                    
                    actualTarget.statusEffects.forEach(effect => {
                        if (effect.speedBonus) targetActualSpeed += effect.speedBonus;
                    });
                    
                    user.Log(`${user.name} 向 ${actualTarget.name} 发起决斗！`, 'buff');
                    
                    // 对目标造成物理伤害
                    user.Attack("SINGLE", "attack", [800], [2.0], actualTarget, DamageType.IMAGINARY, 1, SkillType.SKILL);
                    
                    if (userActualSpeed > targetActualSpeed) {
                        // 速度高于敌方：立即再次行动一次，速度-10，友方最高速+10
                        user.Log(`${user.name} 速度更快，获得再次行动的机会！`, 'buff');
                        
                        // 自身速度-10（通过状态效果）
                        user.addStatusEffect("决斗后的疲惫", "speedBonus", -10, 1, 'self', 'end');
                        
                        // 找到友方最高速单位并提速+10
                       
                        const allies = allCharacters.filter(c => c.type === 'ally' && c.currentHp > 0 && c !== user);
                        if (allies.length > 1) {
                            // 计算所有友方的实际速度
                            const allySpeeds = allies.map(ally => {
                                let speed = ally.speed;
                                ally.statusEffects.forEach(effect => {
                                    if (effect.speedBonus) speed += effect.speedBonus;
                                });
                                return { ally, speed };
                            });
                            
                            // 找到速度最高的友方
                            allySpeeds.sort((a, b) => b.speed - a.speed);
                            const fastestAlly = allySpeeds[0].ally;
                            
                            fastestAlly.addStatusEffect("决斗的激励", "speedBonus", 10, 3, 'self', 'end');
                            user.Log(`${fastestAlly.name} 受到激励，速度提升10点！`, 'buff');
                        }
                        
                        // 标记获得额外行动（使用标志而不是立即修改actionValue）
                        if (!user.hasExtraAction) {
                            user.hasExtraAction = true; // 设置额外行动标志
                            user.Log(`${user.name} 获得额外行动机会！`, 'buff');
                        }
                       
                    } else {
                        // 速度低于敌方：50%概率眩晕敌方
                        const shouldStun = Math.random() < 0.5;
                        
                        if (shouldStun) {
                            actualTarget.addStatusEffect("决斗的眩晕", "stun", true, 1, 'self', 'start');
                            user.Log(`${actualTarget.name} 被眩晕！`, 'debuff');
                        } else {
                            user.Log(`${actualTarget.name} 抵抗了眩晕效果`, 'normal');
                        }
                    }
                }
            },
            {
                name: "终结技 - 此间赋你我荣耀",
                description: "强制将友方所有人的攻击力和体力上限取平均值，并根据骑士数量激活骑士之道效果",
                PointCost: 3,
                targetType: TargetType.ALL,
                skillType: SkillType.ULTIMATE,
                damageType: DamageType.PURE,  // 终结技不造成伤害，使用纯粹类型
                tags: [SkillTag.BUFF, SkillTag.DEBUFF, SkillTag.FIELD],
                icon: "💫",
                executeFunc: function (user, target, allCharacters) {
                    const allies = allCharacters.filter(c => c.type === 'ally' && c.currentHp > 0);
                    
                    if (allies.length === 0) {
                        user.Log("没有友方单位", 'debuff');
                        return;
                    }
                    
                    user.Log(`${user.name} 释放终结技：此间赋你我荣耀！`, 'buff');
                    
                    // 1. 计算所有友方的攻击力和体力上限的平均值
                    let totalAttack = 0;
                    let totalMaxHp = 0;
                    
                    allies.forEach(ally => {
                        totalAttack += ally.baseAttack;
                        totalMaxHp += ally.maxHp;
                    });
                    
                    const avgAttack = Math.floor(totalAttack / allies.length);
                    const avgMaxHp = Math.floor(totalMaxHp / allies.length);
                    
                    // 检查是否存在钫酸
                    const hasFangsuan = allies.some(ally => ally.name === "钫酸");
                    const finalAttack = hasFangsuan ? avgAttack * 2 : avgAttack;
                    const finalMaxHp = hasFangsuan ? avgMaxHp * 2 : avgMaxHp;
                    
                    // 2. 将所有友方的攻击力和体力上限设置为计算值
                    allies.forEach(ally => {
                        // 保存当前HP百分比，以便调整后保持比例
                        const hpPercent = ally.currentHp / ally.maxHp;
                        
                        // 设置新的攻击力和生命上限
                        ally.baseAttack = finalAttack;
                        ally.maxHp = finalMaxHp;
                        ally.currentHp = Math.floor(finalMaxHp * hpPercent);
                        
                        // 添加状态效果标记，持续2回合（使用已存在的类型作为标记）
                        ally.addStatusEffect("荣耀的统一", "damageBonus", 0, 5, 'self', 'end');
                    });
                    
                    user.Log(`所有友方的攻击力统一为 ${finalAttack}，生命上限统一为 ${finalMaxHp}${hasFangsuan ? '（钫酸加成）' : ''}`, 'buff');
                    
                    // 获得立即行动机会
                    user.hasExtraAction = true;
                    user.Log(`${user.name} 获得立即行动机会！`, 'buff');
                    
                    // 3. 检测骑士数量并激活[骑士之道]效果
                    // 假设"骑士"是指名字包含"骑士"或特定角色
                    const knights = allies.filter(ally => 
                        ally.name.includes("骑士") || 
                        ally.name === "钫酸" || 
                        ally.name === "荒弥"
                    );
                    
                    if (knights.length >= 1) {
                        user.Log(`[骑士之道]激活！检测到 ${knights.length} 名骑士`, 'buff');
                        
                        // 基础效果：持续治疗和伤害减免
                        allies.forEach(ally => {
                            // 创建持续治疗效果（使用attackBonus存储骑士数量，用于治疗计算）
                            const effect = new StatusEffect("骑士之道的庇护", 5);
                            effect.turnType = 'self';
                            effect.triggerTime = 'end';
                            effect.owner = ally;
                            effect.attackBonus = knights.length; // 使用attackBonus存储骑士数量
                            effect.appliedTurn = user.gameState?.turnCount || 0;
                            ally.statusEffects.push(effect);
                            
                            // 伤害减免（每人5%）
                            const damageReduction = knights.length * 0.05;
                            const reductionEffect = new StatusEffect("骑士之道的坚韧", 5);
                            reductionEffect.turnType = 'self';
                            reductionEffect.triggerTime = 'end';
                            reductionEffect.owner = ally;
                            reductionEffect.damageReduction = damageReduction;
                            reductionEffect.appliedTurn = user.gameState?.turnCount || 0;
                            ally.statusEffects.push(reductionEffect);
                        });
                        
                        // 检查是否需要增强效果（存在钫酸或至少两名骑士）
                        if (hasFangsuan || knights.length >= 2) {
                            user.Log(`[骑士之道]效果增强！`, 'buff');
                            
                            allies.forEach(ally => {
                                // 免疫三次致命伤
                                if (!ally.hasStatusEffect("致命伤免疫")) {
                                    ally.addStatusEffect("致命伤免疫", "immune", true, 3, 'self', 'end');
                                }
                                
                                // 魔力吸取和生命吸取（30%）
                                // 使用自定义状态效果存储值
                                const lifestealEffect = new StatusEffect("生命吸取", 5);
                                lifestealEffect.turnType = 'self';
                                lifestealEffect.triggerTime = 'end';
                                lifestealEffect.owner = ally;
                                lifestealEffect.value = 0.3; // 存储生命吸取比例
                                lifestealEffect.appliedTurn = user.gameState?.turnCount || 0;
                                ally.statusEffects.push(lifestealEffect);
                                
                                const manastealEffect = new StatusEffect("魔力吸取", 5);
                                manastealEffect.turnType = 'self';
                                manastealEffect.triggerTime = 'end';
                                manastealEffect.owner = ally;
                                manastealEffect.value = 0.3; // 存储魔力吸取比例
                                manastealEffect.appliedTurn = user.gameState?.turnCount || 0;
                                ally.statusEffects.push(manastealEffect);
                            }
                        );}
                        else {const lifestealEffect = new StatusEffect("生命吸取", 5);
                            lifestealEffect.turnType = 'self';
                            lifestealEffect.triggerTime = 'end';
                            lifestealEffect.owner = ally;
                            lifestealEffect.value = 0.5; // 存储生命吸取比例
                            lifestealEffect.appliedTurn = user.gameState?.turnCount || 0;
                            user.statusEffects.push(lifestealEffect);
                            
                            const manastealEffect = new StatusEffect("魔力吸取", 5);
                            manastealEffect.turnType = 'self';
                            manastealEffect.triggerTime = 'end';
                            manastealEffect.owner = ally;
                            manastealEffect.value = 1; // 存储魔力吸取比例
                            manastealEffect.appliedTurn = user.gameState?.turnCount || 0;
                            user.statusEffects.push(manastealEffect);}
                        
                    }
                }
            },
        ],
        
        // 添加被动技能属性
        passiveSkills: {
            // 蹒跚独行
            limpingAlone: {
                deathCount: 0, // 死亡计数
                maxStacks: 10, // 最高叠加10次
                onAllyDeath: function(huangmi, deadAlly, allCharacters) {
                    // 自身减少当前3%生命上限
                    const hpReduction = Math.floor(huangmi.maxHp * 0.03);
                    const oldMaxHp = huangmi.maxHp;
                    huangmi.maxHp = Math.max(1, huangmi.maxHp - hpReduction);
                    huangmi.currentHp = Math.min(huangmi.currentHp, huangmi.maxHp);
                    
                    huangmi.Log(`${huangmi.name} 因队友死亡失去 ${hpReduction} 点生命上限`, 'debuff');
                    
                    // 提高全体队友6%攻击力（叠加，最高10次）
                    if (this.deathCount < this.maxStacks) {
                        this.deathCount++;
                        const allies = allCharacters.filter(c => c.type === 'ally' && c.currentHp > 0 && c !== huangmi);
                        
                        allies.forEach(ally => {
                            // 通过状态效果增加攻击力
                            const stackCount = Math.min(this.deathCount, this.maxStacks);
                            const attackBonus = 0.06 * stackCount;
                            
                            // 移除旧的叠加效果（如果存在）
                            const oldEffectIndex = ally.statusEffects.findIndex(e => e.name === "蹒跚独行的激励");
                            if (oldEffectIndex !== -1) {
                                ally.statusEffects.splice(oldEffectIndex, 1);
                            }
                            
                            // 添加新的叠加效果
                            ally.addStatusEffect("蹒跚独行的激励", "attackPercent", attackBonus, 999, 'self', 'end');
                        });
                        
                        huangmi.Log(`蹒跚独行：全体队友攻击力提升 ${(attackBonus * 100).toFixed(1)}%（叠加${stackCount}次）`, 'buff');
                    }
                    
                    // 获得剥夺能力（使用标记状态效果）
                    if (!huangmi.hasStatusEffect("剥夺之力")) {
                        const stealEffect = new StatusEffect("剥夺之力", 3);
                        stealEffect.turnType = 'self';
                        stealEffect.triggerTime = 'end';
                        stealEffect.owner = huangmi;
                        stealEffect.value = 1; // 标记有剥夺能力
                        stealEffect.uses = 1; // 使用次数
                        stealEffect.appliedTurn = huangmi.gameState?.turnCount || 0;
                        huangmi.statusEffects.push(stealEffect);
                        huangmi.Log(`${huangmi.name} 获得剥夺之力！可以剥夺目标技能和强化效果`, 'buff');
                    } else {
                        // 如果已有，增加持续时间或次数
                        const effect = huangmi.statusEffects.find(e => e.name === "剥夺之力");
                        if (effect) {
                            effect.duration = Math.max(effect.duration, 3);
                            effect.uses = (effect.uses || 0) + 1;
                        }
                    }
                }
            }
        }
    };

    window.FangsuanTemplate = FangsuanTemplate;

    window.registerHuangmi = function (loader) {
        loader.registerCharacterTemplate("Huangmi", FangsuanTemplate);
        // 不创建实例，只注册模板
        // 被动技能会在createCharacter时通过模板添加
    };
})();