(function () {
    // ===== Yushi角色模板 =====
    const YushiTemplate = {
        name: "逾柿",
        type: "ally",
        tag: "knight",
        maxHp: 3000,
        attack: 4000,
        defense: 1000,
        speed: 130,
        critRate: 0.4,
        critDamage: 1,
        maxPoint: 5,
        icon: "🔥",
        skills: [
            {
                name: "普通攻击",
                description: "对敌方主目标造成火属性伤害",
                targetType: TargetType.SINGLE,
                skillType: SkillType.BASIC,
                damageType: DamageType.FIRE,
                tags: [SkillTag.ATTACK, SkillTag.SINGLE_TARGET],
                icon: "⚔️",
                PointCost: -4,
                executeFunc: function (user, target, allCharacters) {
                    const enemies = allCharacters.filter(c => c.type === 'enemy' && c.currentHp > 0);
                    const actualTarget = target || (enemies.length > 0 ? enemies[0] : null);

                    if (actualTarget) {
                        user.Attack("SINGLE", "attack", [1100], [3.0], actualTarget, DamageType.FIRE);
                    } else {
                        user.Log("没有可攻击的目标", 'debuff');
                    }
                }
            },
            {
                name: "火翼的拥抱",
                description: "张开火翼抱住前方3名目标（不论敌我）进行连续三次攻击，每次攻击对自身造成34%生命上限伤害，对敌人造成自身攻击力150%的伤害，对友方回复生命上限5%的血量。攻击时不会死亡。",
                targetType: TargetType.SINGLE,
                skillType: SkillType.SKILL,
                damageType: DamageType.FIRE,
                tags: [SkillTag.ATTACK, SkillTag.HEAL],
                icon: "🔥",
                PointCost: 1,
                executeFunc: function (user, target, allCharacters) {
                    // 获取所有角色（敌友皆可）
                    const allTargets = allCharacters.filter(c => c.currentHp > 0 && c !== user);
                    
                    // 选择前3个目标（如果不足3个则选择所有）
                    const targets = allTargets.slice(0, 3);
                    
                    if (targets.length === 0) {
                        user.Log("没有可作用的目标", 'debuff');
                        return;
                    }

                    user.Log(`${user.name} 张开火翼拥抱前方目标！`, 'buff');
                    
                    // 获取或创建叠加层数标记
                    let stackEffect = user.statusEffects.find(e => e.name === "火翼的拥抱叠加");
                    if (!stackEffect) {
                        stackEffect = new StatusEffect("火翼的拥抱叠加", 999);
                        stackEffect.turnType = 'self';
                        stackEffect.triggerTime = 'end';
                        stackEffect.owner = user;
                        stackEffect.value = 0; // 存储叠加层数（最多4层）
                        user.statusEffects.push(stackEffect);
                    }
                    
                    const maxStacks = 4;
                    let currentStacks = Math.min(stackEffect.value || 0, maxStacks);
                    
                    // 基础攻击次数为3次
                    let attackCount = 3;
                    
                    // 连续进行三次攻击
                    for (let i = 0; i < 3; i++) {
                        user.Log(`--- 第${i + 1}次攻击 ---`, 'buff');
                        
                        // 标记不会死亡（临时状态）
                        const wasImmuneDeath = user.statusEffects.some(e => e.isImmuneDeath);
                        if (!wasImmuneDeath) {
                            const tempImmune = new StatusEffect("火翼攻击免疫死亡", 0);
                            tempImmune.isImmuneDeath = true;
                            tempImmune.turnType = 'self';
                            tempImmune.triggerTime = 'end';
                            tempImmune.owner = user;
                            user.statusEffects.push(tempImmune);
                        }
                        
                        // 累计本回合造成的总伤害（用于生命吸取）
                        let totalDamageThisRound = 0;
                        
                        // 对每个目标执行效果
                        targets.forEach(tgt => {
                            if (tgt.type === 'enemy') {
                                // 对敌人：造成150%攻击力伤害
                                const damage = user.getActualAttack() * 1.5;
                                const finalDamage = user.calculateDamage(damage, DamageType.FIRE, SkillType.SKILL, tgt);
                                tgt.takeDamage(finalDamage, DamageType.FIRE, user);
                                totalDamageThisRound += finalDamage;
                                user.Log(`${user.name} 对 ${tgt.name} 造成 ${Math.floor(finalDamage)} 点火属性伤害`, 'damage');
                            } else if (tgt.type === 'ally') {
                                // 对友方：回复5%生命上限的血量
                                const healAmount = Math.floor(tgt.maxHp * 0.05);
                                const oldHp = tgt.currentHp;
                                tgt.currentHp = Math.min(tgt.maxHp, tgt.currentHp + healAmount);
                                if (tgt.currentHp > oldHp) {
                                    user.Log(`${user.name} 为 ${tgt.name} 回复 ${healAmount} 点生命`, 'heal');
                                }
                            }
                        });
                        
                        // 处理生命吸取和魔力吸取效果（基于本轮造成的总伤害）
                        if (totalDamageThisRound > 0) {
                            user.statusEffects.forEach(effect => {
                                if (effect.name === "生命吸取" && effect.value) {
                                    const lifesteal = Math.floor(totalDamageThisRound * effect.value);
                                    const oldHp = user.currentHp;
                                    user.currentHp = Math.min(user.maxHp, user.currentHp + lifesteal);
                                    if (user.currentHp > oldHp) {
                                        user.Log(`${user.name} 通过生命吸取恢复 ${lifesteal} 点生命`, 'heal');
                                    }
                                }
                                if (effect.name === "魔力吸取" && effect.value) {
                                    const manasteal = effect.value;
                                    if (manasteal > 0) {
                                        user.gainPoint(manasteal);
                                        user.Log(`${user.name} 通过魔力吸取恢复 ${manasteal} 点战技点`, 'Point');
                                    }
                                }
                            });
                        }
                        
                        // 对自身造成34%生命上限伤害
                        const selfDamage = Math.floor(user.maxHp * 0.34);
                        const oldHp = user.currentHp;
                        user.currentHp = Math.max(1, user.currentHp - selfDamage);
                        const actualSelfDamage = oldHp - user.currentHp;
                        user.Log(`${user.name} 因火翼的拥抱受到 ${actualSelfDamage} 点伤害`, 'damage');
                        
                        // 检查是否成功造成17%生命上限的伤害（用于叠加）
                        const thresholdDamage = Math.floor(user.maxHp * 0.17);
                        if (actualSelfDamage >= thresholdDamage && currentStacks < maxStacks) {
                            // 成功触发叠加效果
                            currentStacks++;
                            stackEffect.value = currentStacks;
                            
                            // 对敌方造成20%易伤两回合
                            targets.filter(t => t.type === 'enemy').forEach(enemy => {
                                enemy.addStatusEffect("火翼的易伤", "vulnerability", 0.2, 2, 'self', 'end');
                                user.Log(`${enemy.name} 受到火翼易伤20%`, 'debuff');
                            });
                            
                            // 对友方单位施加10%生命上限护盾
                            targets.filter(t => t.type === 'ally').forEach(ally => {
                                // 使用状态效果标记护盾值（每层10%生命上限）
                                let shieldEffect = ally.statusEffects.find(e => e.name === "火翼的护盾");
                                if (!shieldEffect) {
                                    shieldEffect = new StatusEffect("火翼的护盾", 999);
                                    shieldEffect.turnType = 'self';
                                    shieldEffect.triggerTime = 'end';
                                    shieldEffect.owner = ally;
                                    shieldEffect.value = 0;
                                    shieldEffect.appliedTurn = user.gameState?.turnCount || 0;
                                    ally.statusEffects.push(shieldEffect);
                                }
                                // 更新护盾值（每层10%生命上限）
                                shieldEffect.value = Math.floor(ally.maxHp * 0.1 * currentStacks);
                                user.Log(`${ally.name} 获得 ${shieldEffect.value} 点护盾（${currentStacks}层）`, 'buff');
                            });
                            
                            user.Log(`火翼的拥抱叠加至第 ${currentStacks} 层！`, 'buff');
                        }
                        
                        // 移除临时免疫死亡状态
                        if (!wasImmuneDeath) {
                            user.statusEffects = user.statusEffects.filter(e => e.name !== "火翼攻击免疫死亡");
                        }
                    }
                    
                    // 记录最终叠加层数
                    user.Log(`火翼的拥抱完成！当前叠加 ${currentStacks} 层`, 'buff');
                }
            },
            {
                name: "终结技 - 即使生命未予回应",
                description: "释放终结技，若触发眼的回想，则下回合使自身和任意两名队友获得该隐印记",
                PointCost: 3,
                targetType: TargetType.ALL,
                skillType: SkillType.ULTIMATE,
                damageType: DamageType.FIRE,
                tags: [SkillTag.BUFF, SkillTag.ULTIMATE],
                icon: "💫",
                executeFunc: function (user, target, allCharacters) {
                    user.Log(`${user.name} 释放终结技：即使生命未予回应！`, 'buff');
                    
                    // 检查是否触发眼的回想（检查被动技能）
                    if (user.passiveSkills && user.passiveSkills.eyeRecall) {
                        const eyeRecall = user.passiveSkills.eyeRecall;
                        // 检查是否在本回合触发过眼的回想
                        const triggeredThisTurn = eyeRecall.triggeredThisTurn || false;
                        
                        user.Log(`检查眼的回想状态: triggeredThisTurn=${triggeredThisTurn}, used=${eyeRecall.used}`, 'normal');
                        
                        if (triggeredThisTurn) {
                            // 触发眼的回想，下回合给予该隐印记
                            user.Log(`${user.name} 的终结技触发了眼的回想！`, 'buff');
                            
                            // 标记下回合给予该隐印记
                            if (!user.statusEffects.find(e => e.name === "下回合给予该隐印记")) {
                                const markEffect = new StatusEffect("下回合给予该隐印记", 1);
                                markEffect.turnType = 'self';
                                markEffect.triggerTime = 'start';
                                markEffect.owner = user;
                                markEffect.value = 2; // 给予2名队友
                                markEffect.appliedTurn = user.gameState?.turnCount || 0;
                                user.statusEffects.push(markEffect);
                                user.Log(`${user.name} 获得状态：下回合给予该隐印记`, 'buff');
                            } else {
                                user.Log(`${user.name} 已经有"下回合给予该隐印记"状态`, 'normal');
                            }
                        } else {
                            user.Log(`${user.name} 的终结技未触发眼的回想（本回合未触发眼的回想被动）`, 'normal');
                        }
                    } else {
                        user.Log(`${user.name} 没有眼的回想被动技能`, 'normal');
                    }
                    
                    // 终结技的其他效果（如果有）
                    // 这里可以根据需要添加其他效果
                }
            },
        ],
        
        // 被动技能
        passiveSkills: {
            // 眼的回想
            eyeRecall: {
                used: false, // 每场战斗仅限一次
                triggeredThisTurn: false, // 本回合是否触发
                
                // 在受到致死伤害时触发
                onFatalDamage: function(yushi, allCharacters) {
                    // 检查是否已使用
                    if (this.used) {
                        return false;
                    }
                    
                    // 检查所有上场队友是否全部存活
                    const allies = allCharacters.filter(c => c.type === 'ally' && c.currentHp > 0);
                    const allAlive = allies.length === yushi.gameState.getAllies().length;
                    
                    if (allAlive) {
                        this.used = true;
                        this.triggeredThisTurn = true;
                        yushi.currentHp = 1;
                        yushi.Log(`${yushi.name} 的【眼的回想】触发！血量保持在1`, 'buff');
                        return true;
                    }
                    
                    return false;
                }
            },
            
            // 亡语效果
            deathRattle: {
                // 死亡后每回合开始时触发
                onTurnStart: function(yushi, allCharacters, gameState) {
                    // 找到生命上限血量最少的队友
                    const allies = allCharacters.filter(c => c.type === 'ally' && c.currentHp > 0 && c !== yushi);
                    
                    if (allies.length === 0) {
                        return;
                    }
                    
                    // 按当前HP百分比排序，选择最少的
                    allies.sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));
                    const lowestHpAlly = allies[0];
                    
                    // 回复7%生命上限血量
                    const healAmount = Math.floor(lowestHpAlly.maxHp * 0.07);
                    const oldHp = lowestHpAlly.currentHp;
                    lowestHpAlly.currentHp = Math.min(lowestHpAlly.maxHp, lowestHpAlly.currentHp + healAmount);
                    
                    if (lowestHpAlly.currentHp > oldHp) {
                        gameState.addLog(`${yushi.name} 的亡语：为 ${lowestHpAlly.name} 回复 ${healAmount} 点生命`, 'heal');
                    }
                    
                    // 增加20%攻击力提升
                    lowestHpAlly.addStatusEffect("亡语的激励", "attackPercent", 0.2, 999, 'self', 'end');
                    gameState.addLog(`${yushi.name} 的亡语：${lowestHpAlly.name} 攻击力提升20%`, 'buff');
                }
            }
        }
    };

    window.YushiTemplate = YushiTemplate;

    window.registerYushi = function (loader) {
        loader.registerCharacterTemplate("Yushi", YushiTemplate);
    };
})();
