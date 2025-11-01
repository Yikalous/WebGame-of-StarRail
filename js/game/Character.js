class Character {
    constructor(name, type, maxHp, attack, defense, speed, critRate, critDamage, maxPoint, skills, icon = "🚀", level = 80) {
        this.name = name;
        this.type = type;
        this.level = level;
        this.maxHp = maxHp;
        this.currentHp = maxHp;

        // 基础属性
        this.baseAttack = attack;        // 攻击白值
        this.baseDefense = defense;      // 防御白值
        this.speed = speed;
        this.critRate = critRate;
        this.critDamage = critDamage;
        this.maxPoint = maxPoint;
        this.currentPoint = 0;

        // 百分比加成
        this.attackPercent = 0;          // 攻击%加成
        this.defensePercent = 0;         // 防御%加成
        this.damageBonus = {};           // 各类伤害加成
        this.breakEffect = 0;            // 击破特攻

        // 特殊属性
        this.defenseIgnore = 0;          // 无视防御%
        this.resistancePenetration = {}; // 抗性穿透
        this.vulnerability = 0;          // 易伤

        this.skills = Array.isArray(skills) ? skills : [];
        this.icon = icon;
        this.statusEffects = [];
        this.isActive = false;
        this.gameState = null;

        // 抗性系统
        this.damageResistances = Object.values(DamageType).reduce((obj, k) => {
            obj[k] = 0;
            return obj;
        }, {});

        // 韧性系统（用于怪物）
        this.toughness = type === 'enemy' ? 100 : 0;
        this.maxToughness = type === 'enemy' ? 100 : 0;
        this.isWeaknessBroken = false;
    }

    // 获取实际攻击力（考虑各种加成）
    getActualAttack() {
        let attackBonus = this.attackPercent;

        // 从状态效果中获取攻击加成
        this.statusEffects.forEach(effect => {
            if (effect.attackBonus) attackBonus += effect.attackBonus;
        });

        return this.baseAttack * (1 + attackBonus);
    }

    // 获取实际防御力
    getActualDefense() {
        let defenseBonus = this.defensePercent;
        let defenseReduction = 0;

        this.statusEffects.forEach(effect => {
            if (effect.defenseBonus) defenseBonus += effect.defenseBonus;
            if (effect.defenseReduction) defenseReduction += effect.defenseReduction;
        });

        return this.baseDefense * (1 + defenseBonus) * (1 - defenseReduction);
    }

    updateStatusEffects() {
        this.statusEffects = this.statusEffects.filter(effect => {
            effect.duration -= 1;
            return effect.duration > 0;
        });
    }

    gainPoint(amount) {
        this.currentPoint = Math.min(this.maxPoint, this.currentPoint + amount);
    }

    usePoint(amount) {
        if (this.currentPoint >= amount) {
            this.currentPoint -= amount;
            return true;
        }
        return false;
    }

    canUseSkill(skillType) {
        // 检查是否被沉默
        if (this.statusEffects.some(effect => effect.isSilenced)) {
            return false;
        }

        // 检查是否被眩晕
        if (this.statusEffects.some(effect => effect.isStunned)) {
            return false;
        }

        return true;
    }

    // 添加技能目标选择相关方法
    requiresTargetSelection() {
        return this.targetType === TargetType.SINGLE;
    }

    getTargetDescription() {
        const targetTypes = {
            [TargetType.SINGLE]: '单体目标',
            [TargetType.ALL_ENEMIES]: '全体敌人',
            [TargetType.ALL_ALLIES]: '全体友方',
            [TargetType.ALL]: '全体',
            [TargetType.SELF]: '自身'
        };
        return targetTypes[this.targetType] || '选择目标';
    }

    // ===== 通用技能接口 =====
    // Character.js - 修改 Attack 方法
    Attack(type, baseStat = "attack", basenumber = [100], ratio = [1.0], target = this, damageType = DamageType.PHYSICAL, times = 1, skillType = SkillType.BASIC) {
        const actualTarget = target || this;

        switch (type) {
            case "SINGLE":
                for (let i = 0; i < times; i++) {
                    let totalDamage = 0;
                    for (let j = 0; j < basenumber.length; j++) {
                        totalDamage += basenumber[j] + this.getActualAttack() * ratio[j];
                    }

                    if (actualTarget.currentHp > 0) {
                        const finalDamage = this.calculateDamage(totalDamage, damageType, skillType, actualTarget);
                        const survived = actualTarget.takeDamage(finalDamage, damageType);
                        const critText = this.critArea > 1 ? " (暴击!)" : "";
                        this.Log(`${this.name}对${actualTarget.name}造成${finalDamage}${critText}点${this.getDamageTypeText(damageType)}伤害`, 'damage');

                        // 生命吸取处理
                        this.statusEffects.forEach(effect => {
                            if (effect.name === "生命吸取" && effect.value) {
                                const lifesteal = Math.floor(finalDamage * effect.value);
                                this.currentHp = Math.min(this.maxHp, this.currentHp + lifesteal);
                                if (lifesteal > 0) {
                                    this.Log(`${this.name} 通过生命吸取恢复 ${lifesteal} 点生命`, 'heal');
                                }
                            }
                        });

                        if (!survived) {
                            this.Log(`${actualTarget.name}被击败了！`, 'damage');
                        }
                    }
                }
                break;

            case "AOE":
                const enemies = this.GetTargets("ALL_ENEMIES");
                let totalAoeDamage = 0; // 总伤害统计
                enemies.forEach(enemy => {
                    for (let i = 0; i < times; i++) {
                        let totalDamage = 0;
                        for (let j = 0; j < basenumber.length; j++) {
                            totalDamage += basenumber[j] + this.getActualAttack() * ratio[j];
                        }

                        if (enemy.currentHp > 0) {
                            const finalDamage = this.calculateDamage(totalDamage, damageType, skillType, enemy);
                            totalAoeDamage += finalDamage; // 累加总伤害
                            const survived = enemy.takeDamage(finalDamage, damageType);
                            const critText = this.critArea > 1 ? " (暴击!)" : "";
                            this.Log(`${this.name}对${enemy.name}造成${finalDamage}${critText}点${this.getDamageTypeText(damageType)}伤害`, 'damage');

                            if (!survived) {
                                this.Log(`${enemy.name}被击败了！`, 'damage');
                            }
                        }
                    }
                });
                
                // AOE攻击的生命吸取
                if (totalAoeDamage > 0) {
                    this.statusEffects.forEach(effect => {
                        if (effect.name === "生命吸取" && effect.value) {
                            const lifesteal = Math.floor(totalAoeDamage * effect.value);
                            this.currentHp = Math.min(this.maxHp, this.currentHp + lifesteal);
                            if (lifesteal > 0) {
                                this.Log(`${this.name} 通过生命吸取恢复 ${lifesteal} 点生命`, 'heal');
                            }
                        }
                    });
                }
                break;

            case "BOUND":
                const allEnemies = this.GetTargets("ALL_ENEMIES");
                if (allEnemies.length === 0) {
                    this.Log("没有可攻击的敌人", 'debuff');
                    return;
                }

                this.Log(`${this.name} 发动弹射攻击！`, 'damage');

                let totalBoundDamage = 0; // 总伤害统计
                for (let i = 0; i < times; i++) {
                    const randomIndex = Math.floor(Math.random() * allEnemies.length);
                    const randomTarget = allEnemies[randomIndex];

                    let totalDamage = 0;
                    for (let j = 0; j < basenumber.length; j++) {
                        totalDamage += basenumber[j] + this.getActualAttack() * ratio[j];
                    }

                    if (randomTarget.currentHp > 0) {
                        const finalDamage = this.calculateDamage(totalDamage, damageType, skillType, randomTarget);
                        totalBoundDamage += finalDamage; // 累加总伤害
                        const survived = randomTarget.takeDamage(finalDamage, damageType);
                        const critText = this.critArea > 1 ? " (暴击!)" : "";
                        this.Log(`第${i + 1}段弹射对${randomTarget.name}造成${finalDamage}${critText}点${this.getDamageTypeText(damageType)}伤害`, 'damage');

                        if (!survived) {
                            this.Log(`${randomTarget.name}被击败了！`, 'damage');
                        }
                    }
                }
                
                // BOUND攻击的生命吸取
                if (totalBoundDamage > 0) {
                    this.statusEffects.forEach(effect => {
                        if (effect.name === "生命吸取" && effect.value) {
                            const lifesteal = Math.floor(totalBoundDamage * effect.value);
                            this.currentHp = Math.min(this.maxHp, this.currentHp + lifesteal);
                            if (lifesteal > 0) {
                                this.Log(`${this.name} 通过生命吸取恢复 ${lifesteal} 点生命`, 'heal');
                            }
                        }
                    });
                }
                break;

            case "SPREAD":
                if (enemies.length === 0) {
                    this.Log("没有可攻击的敌人", 'debuff');
                    return;
                }

                // 找到主目标在敌人列表中的位置
                const mainTargetIndex = enemies.findIndex(enemy => enemy === actualTarget);
                if (mainTargetIndex === -1) {
                    this.Log("主目标无效", 'debuff');
                    return;
                }

                this.Log(`${this.name} 发动扩散攻击！`, 'damage');

                let totalSpreadDamage = 0; // 总伤害统计

                // 对主目标造成伤害（使用第一个倍率）
                for (let i = 0; i < times; i++) {
                    let mainDamage = 0;
                    const mainBase = basenumber[0] || 0;
                    const mainRatio = ratio[0] || 0;
                    mainDamage += mainBase + this.getActualAttack() * mainRatio;

                    if (actualTarget.currentHp > 0) {
                        const finalMainDamage = this.calculateDamage(mainDamage, damageType, skillType, actualTarget);
                        totalSpreadDamage += finalMainDamage; // 累加总伤害
                        const survived = actualTarget.takeDamage(finalMainDamage, damageType);
                        const critText = this.critArea > 1 ? " (暴击!)" : "";
                        this.Log(`${this.name}对${actualTarget.name}造成${finalMainDamage}${critText}点${this.getDamageTypeText(damageType)}伤害`, 'damage');

                        if (!survived) {
                            this.Log(`${actualTarget.name}被击败了！`, 'damage');
                        }
                    }
                }

                // 对相邻目标造成伤害（使用第二个倍率）
                const adjacentTargets = this.getAdjacentTargets(enemies, mainTargetIndex);

                adjacentTargets.forEach(adjacentTarget => {
                    for (let i = 0; i < times; i++) {
                        let spreadDamage = 0;
                        const spreadBase = basenumber[1] || (basenumber[0] || 0); // 如果没有第二个倍率，使用第一个
                        const spreadRatio = ratio[1] || (ratio[0] || 0); // 如果没有第二个倍率，使用第一个
                        spreadDamage += spreadBase + this.getActualAttack() * spreadRatio;

                        if (adjacentTarget.currentHp > 0) {
                            const finalSpreadDamage = this.calculateDamage(spreadDamage, damageType, skillType, adjacentTarget);
                            totalSpreadDamage += finalSpreadDamage; // 累加总伤害
                            const survived = adjacentTarget.takeDamage(finalSpreadDamage, damageType);
                            const critText = this.critArea > 1 ? " (暴击!)" : "";
                            this.Log(`扩散对${adjacentTarget.name}造成${finalSpreadDamage}${critText}点${this.getDamageTypeText(damageType)}伤害`, 'damage');

                            if (!survived) {
                                this.Log(`${adjacentTarget.name}被击败了！`, 'damage');
                            }
                        }
                    }
                });
                
                // SPREAD攻击的生命吸取处理（基于总伤害）
                if (totalSpreadDamage > 0) {
                    this.statusEffects.forEach(effect => {
                        if (effect.name === "生命吸取" && effect.value) {
                            const lifesteal = Math.floor(totalSpreadDamage * effect.value);
                            this.currentHp = Math.min(this.maxHp, this.currentHp + lifesteal);
                            if (lifesteal > 0) {
                                this.Log(`${this.name} 通过生命吸取恢复 ${lifesteal} 点生命`, 'heal');
                            }
                        }
                    });
                }
                break;

            default:
                console.warn(`未知的攻击类型: ${type}`);
        }
        
        // 生命吸取效果处理（在造成伤害后）
        if (actualTarget && type !== "AOE" && type !== "BOUND") {
            // 只对单个目标攻击处理生命吸取
            this.statusEffects.forEach(effect => {
                if (effect.name === "生命吸取" && effect.value) {
                    // 注意：这里需要在Attack方法内部处理，但无法直接获取finalDamage
                    // 所以需要在每个case中单独处理，或重构Attack方法
                }
            });
        }
    }

    getAdjacentTargets(enemies, mainIndex) {
        const adjacentTargets = [];

        // 左边的目标
        if (mainIndex > 0) {
            adjacentTargets.push(enemies[mainIndex - 1]);
        }

        // 右边的目标
        if (mainIndex < enemies.length - 1) {
            adjacentTargets.push(enemies[mainIndex + 1]);
        }

        return adjacentTargets;
    }

    Heal(targetMode, amount, ratio = 0) {
        const targets = this.GetTargets(targetMode);
        targets.forEach(t => {
            const healAmt = Math.floor(amount + this.attack * ratio);
            t.currentHp = Math.min(t.maxHp, t.currentHp + healAmt);
            this.Log(`${this.name}治疗了${t.name} ${healAmt} HP`, 'heal');
        });
    }

    GetTargets(mode) {
        const allies = this.gameState.getAllies().filter(c => c.currentHp > 0);
        const enemies = this.gameState.getEnemies().filter(c => c.currentHp > 0);
        switch (mode) {
            case "SINGLE": return [enemies[0]];
            case "ALL_ENEMIES": return enemies;
            case "ALL_ALLIES": return allies;
            case "SELF": return [this];
            case "SPREAD": return enemies.slice(0, 3);
            default: return [];
        }
    }

    ApplyDamage(target, dmg, type = DamageType.PHYSICAL) {
        const result = this.calculateFinalDamage(dmg, type);
        target.takeDamage(result.damage, type);
        const critText = result.isCrit ? " (暴击!)" : "";
        this.Log(`${this.name}对${target.name}造成${result.damage}${critText}点${type}伤害`, 'damage');
    }

    // Character.js - 更新 takeDamage 方法
    takeDamage(amount, type) {
        // 免疫死亡状态检查（检查免疫致命伤次数）
        if (amount >= this.currentHp) {
            const immuneEffects = this.statusEffects.filter(e => e.isImmuneDeath);
            if (immuneEffects.length > 0) {
                // 消耗一次免疫致命伤
                const immuneEffect = immuneEffects[0];
                if (immuneEffect.value === undefined || immuneEffect.value > 0) {
                    immuneEffect.value = (immuneEffect.value || 1) - 1;
                    if (immuneEffect.value <= 0) {
                        // 移除效果
                        this.statusEffects = this.statusEffects.filter(e => e !== immuneEffect);
                    }
                    this.currentHp = 1;
                    this.Log(`${this.name} 免疫了致命伤害！`, 'buff');
                    return true;
                }
            }
        }

        this.currentHp = Math.max(0, this.currentHp - amount);
        const survived = this.currentHp > 0;
        
        // 检测友方死亡，触发被动技能
        if (!survived && this.type === 'ally' && this.gameState) {
            // 检查是否有荒弥在场，触发被动技能
            const huangmi = this.gameState.characters.find(c => 
                c.name === "荒弥" && c.currentHp > 0 && c.passiveSkills && c.passiveSkills.limpingAlone
            );
            
            if (huangmi && huangmi.passiveSkills.limpingAlone) {
                huangmi.passiveSkills.limpingAlone.onAllyDeath(huangmi, this, this.gameState.characters);
            }
        }
        
        return survived;
    }

    // Character.js - 添加完整的伤害计算方法
    calculateDamage(baseDamage, damageType, skillType, target, isBreakDamage = false) {
        // === 1. 基础伤害区 ===
        const baseDamageArea = baseDamage;

        // === 2. 防御区 ===
        const defenseArea = this.calculateDefenseArea(target);

        // === 3. 双暴区 ===
        const critArea = this.calculateCritArea();

        // === 4. 击破特攻区 ===
        const breakArea = isBreakDamage ? this.calculateBreakArea() : 1;

        // === 5. 增伤区 ===
        const damageBonusArea = this.calculateDamageBonusArea(damageType, skillType);

        // === 6. 易伤区 ===
        const vulnerabilityArea = this.calculateVulnerabilityArea(target);

        // === 7. 虚弱区 === (这里简化处理)
        const weaknessArea = 1; // 通常为1

        // === 8. 减伤区 ===
        const damageReductionArea = this.calculateDamageReductionArea(target);

        // === 9. 抗性区 ===
        const resistanceArea = this.calculateResistanceArea(damageType, target);

        // 最终伤害计算
        let finalDamage = baseDamageArea * defenseArea * critArea * breakArea *
            damageBonusArea * vulnerabilityArea * weaknessArea *
            damageReductionArea * resistanceArea;

        return Math.floor(finalDamage);
    }

    // 防御区计算
    calculateDefenseArea(target) {
        const attackerLevel = this.level;
        const defenderLevel = target.level;
        const defenderDefense = target.getActualDefense();

        // 计算无视防御
        let defenseIgnore = this.defenseIgnore;
        this.statusEffects.forEach(effect => {
            defenseIgnore += effect.defenseIgnore || 0;
        });

        const actualDefense = defenderDefense * (1 - defenseIgnore);

        return (200 + 10 * attackerLevel) / ((200 + 10 * attackerLevel) + actualDefense);
    }

    // 双暴区计算
    calculateCritArea() {
        const isCrit = Math.random() < this.critRate;
        return isCrit ? (1 + this.critDamage) : 1;
    }

    // 击破特攻区计算
    calculateBreakArea() {
        let breakEffect = this.breakEffect;
        this.statusEffects.forEach(effect => {
            breakEffect += effect.breakEffect || 0;
        });
        return 1 + breakEffect;
    }

    // 增伤区计算
    // 修改伤害计算方法，整合所有状态效果加成
    calculateDamageBonusArea(damageType, skillType) {
        let totalBonus = 0;

        // 基础伤害加成
        if (this.damageBonus[damageType]) {
            totalBonus += this.damageBonus[damageType];
        }

        // 技能类型加成
        totalBonus += this.getTotalDamageBonus(skillType);

        // 伤害类型加成
        totalBonus += this.getTotalDamageTypeBonus(damageType);

        // 状态效果提供的所有加成
        this.statusEffects.forEach(effect => {
            totalBonus += effect.getDamageBonus(skillType);
            totalBonus += effect.getDamageTypeBonus(damageType);
        });

        return 1 + totalBonus;
    }

    // 新增方法：获取特定伤害类型的总加成
    getTotalDamageTypeBonus(damageType) {
        let bonus = 0;

        // 角色自身的伤害类型加成
        switch (damageType) {
            case DamageType.PHYSICAL: bonus += this.damageBonus.physical || 0; break;
            case DamageType.FIRE: bonus += this.damageBonus.fire || 0; break;
            case DamageType.ICE: bonus += this.damageBonus.ice || 0; break;
            case DamageType.LIGHTNING: bonus += this.damageBonus.lightning || 0; break;
            case DamageType.QUANTUM: bonus += this.damageBonus.quantum || 0; break;
            case DamageType.IMAGINARY: bonus += this.damageBonus.imaginary || 0; break;
            case DamageType.WIND: bonus += this.damageBonus.wind || 0; break;
        }

        return bonus;
    }

    // 易伤区计算
    calculateVulnerabilityArea(target) {
        let vulnerability = target.vulnerability;
        target.statusEffects.forEach(effect => {
            vulnerability += effect.vulnerability || 0;
            vulnerability += effect.damageTakenBonus || 0;
        });
        return 1 + vulnerability;
    }

    // 减伤区计算
    calculateDamageReductionArea(target) {
        let damageReduction = 0;
        target.statusEffects.forEach(effect => {
            damageReduction += effect.damageReduction || 0;
        });

        // 韧性减伤（怪物韧性未破时）
        if (target.type === 'enemy' && !target.isWeaknessBroken && target.toughness > 0) {
            damageReduction += 0.1; // 10%韧性减伤
        }

        return 1 - damageReduction;
    }

    // 抗性区计算
    calculateResistanceArea(damageType, target) {
        // 基础抗性
        let baseResistance = 0;
        if (target.type === 'enemy') {
            baseResistance = 0.2; // 20%基础抗性
        }

        // 角色抗性
        const characterResistance = target.damageResistances[damageType] || 0;

        // 抗性降低（来自攻击者的状态效果）
        let resistanceReduction = 0;
        this.statusEffects.forEach(effect => {
            resistanceReduction += effect.getResistanceReduction(damageType);
        });

        // 抗性穿透（来自攻击者的状态效果）
        let resistancePenetration = this.resistancePenetration[damageType] || 0;
        this.statusEffects.forEach(effect => {
            resistancePenetration += effect.getResistancePenetration(damageType);
        });

        // 目标身上的抗性降低效果
        target.statusEffects.forEach(effect => {
            resistanceReduction += effect.getResistanceReduction(damageType);
        });

        const finalResistance = baseResistance + characterResistance - resistanceReduction - resistancePenetration;

        return Math.max(0, Math.min(2, 1 - finalResistance));
    }

    Log(msg, type = 'normal') {
        if (this.gameState?.addLog) this.gameState.addLog(msg, type);
        else console.log(msg);
    }

    canAct() {
        // 不能行动条件：死亡或眩晕等控制状态
        if (this.currentHp <= 0) return false;
        if (this.hasStatusType("stun")) return false;
        return true;
    }

    canUseSkill(skillType) {
        if (this.currentHp <= 0) return false;
        if (this.hasStatusType("stun")) return false;

        // 检查是否被沉默（不影响终极技和特殊技）
        if (this.hasStatusType("silence")) {
            return skillType === SkillType.ULTIMATE || skillType === SkillType.SPECIAL;
        }

        return true;
    }

    hasStatusEffect(name) {
        return this.statusEffects.some(se => se.name === name);
    }

    addStatusEffect(name, type, value, duration = 3, turnType = 'all', triggerTime = 'end', extraParams = {}) {
        // 创建基础状态效果
        const effect = new StatusEffect(name, duration);
        effect.turnType = turnType;
        effect.triggerTime = triggerTime;
        effect.owner = this;
        effect.appliedTurn = this.gameState?.turnCount || 0;

        // 根据类型设置不同的效果属性
        switch (type) {
            // === 基础属性加成 ===
            case "attackBonus":
                effect.attackBonus = value;
                break;
            case "defenseBonus":
                effect.defenseBonus = value;
                break;
            case "speedBonus":
                effect.speedBonus = value;
                break;

            // === 百分比属性加成 ===
            case "attackPercent":
                effect.attackPercent = value;
                break;
            case "defensePercent":
                effect.defensePercent = value;
                break;

            // === 伤害加成区 ===
            case "damageBonus":
                effect.damageBonus = value;
                break;
            case "basicAttackBonus":
                effect.basicAttackBonus = value;
                break;
            case "skillBonus":
                effect.skillBonus = value;
                break;
            case "ultimateBonus":
                effect.ultimateBonus = value;
                break;
            case "followUpBonus":
                effect.followUpBonus = value;
                break;

            // === 伤害类型加成 ===
            case "physicalBonus":
                effect.physicalBonus = value;
                break;
            case "fireBonus":
                effect.fireBonus = value;
                break;
            case "iceBonus":
                effect.iceBonus = value;
                break;
            case "lightningBonus":
                effect.lightningBonus = value;
                break;
            case "quantumBonus":
                effect.quantumBonus = value;
                break;
            case "imaginaryBonus":
                effect.imaginaryBonus = value;
                break;
            case "windBonus":
                effect.windBonus = value;
                break;

            // === 易伤和抗性区 ===
            case "damageTakenBonus":
                effect.damageTakenBonus = value;
                break;
            case "vulnerability":
                effect.vulnerability = value;
                break;

            // === 抗性相关 ===
            case "resistanceReduction":
                effect.resistanceReduction = value; // value 应该是对象 {物理: 0.1}
                break;
            case "defenseIgnore":
                effect.defenseIgnore = value;
                break;
            case "resistancePenetration":
                effect.resistancePenetration = value; // value 应该是对象 {物理: 0.1}
                break;

            // === 击破相关 ===
            case "breakEffect":
                effect.breakEffect = value;
                break;
            case "breakEfficiency":
                effect.breakEfficiency = value;
                break;

            // === 特殊状态 ===
            case "immune":
                effect.isImmuneDeath = true;
                break;
            case "silence":
                effect.isSilenced = true;
                break;
            case "stun":
                effect.isStunned = true;
                effect.triggerTime = 'start';
                break;
            case "freeze":
                effect.isFrozen = true;
                effect.triggerTime = 'start';
                break;
            case "burn":
                effect.isBurned = true;
                break;
            case "shock":
                effect.isShocked = true;
                break;
            
            // === 自定义效果类型 ===
            case "damageReduction":
                effect.damageReduction = value;
                break;
            case "lifesteal":
                effect.value = value; // 存储生命吸取比例
                break;
            case "manasteal":
                effect.value = value; // 存储魔力吸取比例
                break;

            default:
                console.warn(`未知的状态效果类型: ${type}`);
                return;
        }

        // 处理额外参数
        if (extraParams.turnType) effect.turnType = extraParams.turnType;
        if (extraParams.triggerTime) effect.triggerTime = extraParams.triggerTime;

        // 检查是否已存在同名效果
        const existingIndex = this.statusEffects.findIndex(eff => eff.name === name);
        if (existingIndex !== -1) {
            this.statusEffects[existingIndex] = effect;
            this.Log(`${this.name}的状态【${name}】已更新`, 'buff');
        } else {
            this.statusEffects.push(effect);
            this.Log(`${this.name}获得状态【${name}】`, 'buff');
        }

        return effect;
    }

    // 新增方法：获取特定伤害类型的总加成
    getTotalDamageTypeBonus(damageType) {
        let bonus = 0;

        // 角色自身的伤害类型加成
        switch (damageType) {
            case DamageType.PHYSICAL: bonus += this.damageBonus.physical || 0; break;
            case DamageType.FIRE: bonus += this.damageBonus.fire || 0; break;
            case DamageType.ICE: bonus += this.damageBonus.ice || 0; break;
            case DamageType.LIGHTNING: bonus += this.damageBonus.lightning || 0; break;
            case DamageType.QUANTUM: bonus += this.damageBonus.quantum || 0; break;
            case DamageType.IMAGINARY: bonus += this.damageBonus.imaginary || 0; break;
            case DamageType.WIND: bonus += this.damageBonus.wind || 0; break;
        }

        return bonus;
    }

    // 新增方法：批量添加状态效果
    addMultipleStatusEffects(effects) {
        effects.forEach(effectConfig => {
            this.addStatusEffect(
                effectConfig.name,
                effectConfig.type,
                effectConfig.value,
                effectConfig.duration,
                effectConfig.turnType,
                effectConfig.triggerTime,
                effectConfig.extraParams
            );
        });
    }

    getDamageTypeText(damageType) {
        const texts = {
            [DamageType.PHYSICAL]: '物理',
            [DamageType.FIRE]: '火',
            [DamageType.ICE]: '冰',
            [DamageType.LIGHTNING]: '雷',
            [DamageType.QUANTUM]: '量子',
            [DamageType.IMAGINARY]: '虚数',
            [DamageType.WIND]: '风',
            [DamageType.PURE]: '真实'
        };
        return texts[damageType] || damageType;
    }

    // 检查是否有特定类型的状态效果
    hasStatusType(type) {
        return this.statusEffects.some(effect => {
            switch (type) {
                case "silence": return effect.isSilenced;
                case "stun": return effect.isStunned;
                case "immune": return effect.isImmuneDeath;
                default: return false;
            }
        });
    }

    // 移除特定类型的状态效果
    removeStatusType(type) {
        this.statusEffects = this.statusEffects.filter(effect => {
            switch (type) {
                case "silence": return !effect.isSilenced;
                case "stun": return !effect.isStunned;
                case "immune": return !effect.isImmuneDeath;
                default: return true;
            }
        });
    }

    // 获取所有状态效果的总加成
    getTotalDamageBonus(skillType) {
        return this.statusEffects.reduce((total, effect) => {
            return total + effect.getDamageBonus(skillType);
        }, 0);
    }

    // 检查是否可以被眩晕（免疫死亡状态可能免疫眩晕）
    canBeStunned() {
        return !this.hasStatusType("immune");
    }
}

window.Character = Character;