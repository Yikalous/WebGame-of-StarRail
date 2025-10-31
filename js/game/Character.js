class Character {
    constructor(name, type, maxHp, attack, critRate, critDamage, maxEnergy, skills, icon = "🚀") {
        this.name = name;
        this.type = type;
        this.maxHp = maxHp;
        this.currentHp = maxHp;
        this.attack = attack;
        this.critRate = critRate;
        this.critDamage = critDamage;
        this.maxEnergy = maxEnergy;
        this.currentEnergy = 0;
        this.skills = skills;
        this.icon = icon;
        this.statusEffects = [];
        this.isActive = false;
        this.gameState = null;

        this.damageResistances = {
            [DamageType.PHYSICAL]: 0,
            [DamageType.FIRE]: 0,
            [DamageType.ICE]: 0,
            [DamageType.LIGHTNING]: 0,
            [DamageType.QUANTUM]: 0,
            [DamageType.IMAGINARY]: 0,
            [DamageType.WIND]: 0,
            [DamageType.PURE]: 0
        };

        // 新增：追加攻击相关属性
        this.followUpAttackChance = 0;
        this.followUpAttackSkill = null;
        this.followUpAttackConditions = [];
        this.lastUsedSkillType = null; // 记录最后使用的技能类型

        // 钫酸的特殊属性
        if (name === "钫酸") {
            this.maxMana = 2000;
            this.currentMana = 2000;
            this.isSwordActive = false;
            this.swordTimer = 0;
        }
    }

    takeDamage(damage, damageType = DamageType.PHYSICAL) {
        let damageTakenBonus = 0;
        this.statusEffects.forEach(effect => {
            damageTakenBonus += effect.damageTakenBonus || 0;
        });

        const resistance = this.damageResistances[damageType] || 0;
        const resistanceMultiplier = 1 - (resistance / 100);

        const actualDamage = Math.floor(damage * (1 + damageTakenBonus) * resistanceMultiplier);
        this.currentHp -= actualDamage;

        if (this.currentHp < 0) {
            for (const effect of this.statusEffects) {
                if (effect.isImmuneDeath && this.currentHp <= 0) {
                    this.currentHp = 1;
                    return true;
                }
            }
            this.currentHp = 0;
        }

        return this.currentHp > 0;
    }

    performAttack(skill, target, allCharacters) {
        // 记录最后使用的技能类型
        this.lastUsedSkillType = skill.skillType;
        
        // 执行技能
        const result = skill.execute(this, target, allCharacters);
        
        // 攻击后检查追加攻击
        if (result && this.canTriggerFollowUp(skill.skillType, target)) {
            setTimeout(() => {
                this.executeFollowUpAttack(target, allCharacters);
            }, 500);
        }
        
        return result;
    }

    // 新增：设置追加攻击
    setFollowUpAttack(skill, chance = 0.3, conditions = []) {
        this.followUpAttackSkill = skill;
        this.followUpAttackChance = chance;
        this.followUpAttackConditions = conditions;
    }

    // 新增：检查是否可以触发追加攻击
    canTriggerFollowUp(attackType, target) {
        if (!this.followUpAttackSkill) return false;
        
        // 钫酸特殊逻辑：宝剑激活时普通攻击必定触发追加攻击
        if (this.name === "钫酸" && this.isSwordActive && attackType === SkillType.BASIC) {
            return true;
        }
        
        // 检查概率
        if (Math.random() > this.followUpAttackChance) return false;
        
        // 检查触发条件
        for (const condition of this.followUpAttackConditions) {
            if (!this.checkFollowUpCondition(condition, target, attackType)) {
                return false;
            }
        }
        
        return true;
    }

    // 新增：检查触发条件
    checkFollowUpCondition(condition, target, attackType) {
        switch (condition.type) {
            case 'targetHpBelow':
                return target.currentHp / target.maxHp <= condition.value;
            case 'targetHasDebuff':
                return target.statusEffects.some(effect => 
                    effect.name === condition.effectName || effect.isSilenced || effect.isStunned
                );
            case 'selfHpAbove':
                return this.currentHp / this.maxHp >= condition.value;
            case 'afterSkill':
                return condition.skillTypes.includes(attackType);
            default:
                return true;
        }
    }

    // 新增：执行追加攻击
    executeFollowUpAttack(target, allCharacters) {
        if (!this.followUpAttackSkill) return false;
        
        // 钫酸特殊逻辑：宝剑激活时使用特殊描述
        if (this.name === "钫酸" && this.isSwordActive) {
            this.gameState.addLog(
                `<span style="color: #ba68c8">${this.name}的宝剑引导追加攻击！</span>`,
                'buff'
            );
        } else {
            this.gameState.addLog(
                `<span style="color: #ba68c8">${this.name}触发追加攻击！</span>`,
                'buff'
            );
        }
        
        return this.followUpAttackSkill.execute(this, target, allCharacters);
    }


    heal(amount) {
        this.currentHp += amount;
        if (this.currentHp > this.maxHp) {
            this.currentHp = this.maxHp;
        }
    }

    gainEnergy(amount) {
        const oldEnergy = this.currentEnergy;
        this.currentEnergy += amount;
        if (this.currentEnergy > this.maxEnergy) {
            this.currentEnergy = this.maxEnergy;
        }
        console.log(`获得能量: ${amount}, 从 ${oldEnergy} 到 ${this.currentEnergy}`);
    }

    useEnergy(amount) {
        console.log(`使用能量: 需要 ${amount}, 当前 ${this.currentEnergy}`);
        if (this.currentEnergy >= amount) {
            this.currentEnergy -= amount;
            console.log(`能量使用成功, 剩余 ${this.currentEnergy}`);
            return true;
        }
        console.log(`能量不足, 使用失败`);
        return false;
    }

    addStatusEffect(effect) {
        this.statusEffects.push(effect);
    }

    removeStatusEffect(effectName) {
        this.statusEffects = this.statusEffects.filter(effect => effect.name !== effectName);
    }

    hasStatusEffect(effectName) {
        return this.statusEffects.some(effect => effect.name === effectName);
    }

    updateStatusEffects() {
        this.statusEffects = this.statusEffects.filter(effect => {
            effect.duration--;
            return effect.duration > 0;
        });
    }

    calculateFinalDamage(baseDamage, damageType = DamageType.PHYSICAL, skillType = SkillType.BASIC) {
        let finalDamage = baseDamage;

        const isCrit = Math.random() < this.critRate;
        if (isCrit) {
            finalDamage *= (1 + this.critDamage);
        }

        let totalDamageBonus = 0;
        this.statusEffects.forEach(effect => {
            totalDamageBonus += effect.getDamageBonus(skillType);
        });

        finalDamage *= (1 + totalDamageBonus);

        if (damageType !== DamageType.PURE) {
            const resistance = this.damageResistances[damageType] || 0;
            finalDamage *= (1 - resistance / 100);
        }

        return {
            damage: Math.floor(finalDamage),
            isCrit: isCrit,
            damageType: damageType,
            skillType: skillType
        };
    }

    canAct() {
        if (this.hasStatusEffect("眩晕") || this.statusEffects.some(effect => effect.isStunned)) {
            return false;
        }
        return true;
    }

    canUseSkill(skillType) {
        if (!this.canAct()) {
            return false;
        }

        if ((skillType === SkillType.SKILL || skillType === SkillType.ULTIMATE) && 
            (this.hasStatusEffect("技能沉默") || this.statusEffects.some(effect => effect.isSilenced))) {
            return false;
        }

        return true;
    }

    setDamageResistance(damageType, resistance) {
        this.damageResistances[damageType] = resistance;
    }

    getDamageResistance(damageType) {
        return this.damageResistances[damageType] || 0;
    }
}

window.Character = Character;