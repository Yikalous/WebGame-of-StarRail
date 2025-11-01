// StatusEffect.js
class StatusEffect {
    constructor(name, duration, 
                // 基础属性加成
                attackBonus = 0,
                defenseBonus = 0,
                speedBonus = 0,
                
                // 百分比属性加成
                attackPercent = 0,
                defensePercent = 0,
                
                // 伤害加成区
                damageBonus = 0,
                basicAttackBonus = 0,
                skillBonus = 0,
                ultimateBonus = 0,
                followUpBonus = 0,
                
                // 伤害类型加成
                physicalBonus = 0,
                fireBonus = 0,
                iceBonus = 0,
                lightningBonus = 0,
                quantumBonus = 0,
                imaginaryBonus = 0,
                windBonus = 0,
                
                // 易伤和抗性区
                damageTakenBonus = 0,
                vulnerability = 0,
                damageReduction = 0, // 伤害减免
                
                // 抗性相关
                resistanceReduction = {}, // {物理: 0.1, 火: 0.2}
                defenseIgnore = 0,
                resistancePenetration = {}, // {物理: 0.1}
                
                // 击破相关
                breakEffect = 0,
                breakEfficiency = 0,
                
                // 特殊效果
                isImmuneDeath = false,
                isSilenced = false,
                isStunned = false,
                isFrozen = false,
                isBurned = false,
                isShocked = false,
                
                // 回合控制
                turnType = 'all',
                triggerTime = 'end'
    ) {
        this.name = name;
        this.duration = duration;
        this.initialDuration = duration;
        
        // 基础属性
        this.attackBonus = attackBonus;
        this.defenseBonus = defenseBonus;
        this.speedBonus = speedBonus;
        
        // 百分比属性
        this.attackPercent = attackPercent;
        this.defensePercent = defensePercent;
        
        // 伤害加成
        this.damageBonus = damageBonus;
        this.basicAttackBonus = basicAttackBonus;
        this.skillBonus = skillBonus;
        this.ultimateBonus = ultimateBonus;
        this.followUpBonus = followUpBonus;
        
        // 伤害类型加成
        this.physicalBonus = physicalBonus;
        this.fireBonus = fireBonus;
        this.iceBonus = iceBonus;
        this.lightningBonus = lightningBonus;
        this.quantumBonus = quantumBonus;
        this.imaginaryBonus = imaginaryBonus;
        this.windBonus = windBonus;
        
        // 易伤和抗性
        this.damageTakenBonus = damageTakenBonus;
        this.vulnerability = vulnerability;
        this.damageReduction = damageReduction;
        
        // 抗性相关
        this.resistanceReduction = resistanceReduction;
        this.defenseIgnore = defenseIgnore;
        this.resistancePenetration = resistancePenetration;
        
        // 击破相关
        this.breakEffect = breakEffect;
        this.breakEfficiency = breakEfficiency;
        
        // 特殊状态
        this.isImmuneDeath = isImmuneDeath;
        this.isSilenced = isSilenced;
        this.isStunned = isStunned;
        this.isFrozen = isFrozen;
        this.isBurned = isBurned;
        this.isShocked = isShocked;
        
        // 回合控制
        this.turnType = turnType;
        this.triggerTime = triggerTime;
        this.appliedTurn = 0;
        this.owner = null;
    }

    // 获取特定伤害类型的加成
    getDamageTypeBonus(damageType) {
        switch(damageType) {
            case DamageType.PHYSICAL: return this.physicalBonus;
            case DamageType.FIRE: return this.fireBonus;
            case DamageType.ICE: return this.iceBonus;
            case DamageType.LIGHTNING: return this.lightningBonus;
            case DamageType.QUANTUM: return this.quantumBonus;
            case DamageType.IMAGINARY: return this.imaginaryBonus;
            case DamageType.WIND: return this.windBonus;
            default: return 0;
        }
    }

    // 获取特定伤害类型的抗性穿透
    getResistancePenetration(damageType) {
        return this.resistancePenetration[damageType] || 0;
    }

    // 获取特定伤害类型的抗性降低
    getResistanceReduction(damageType) {
        return this.resistanceReduction[damageType] || 0;
    }

    getDamageBonus(skillType) {
        let bonus = this.damageBonus;
        
        switch(skillType) {
            case SkillType.BASIC:
                bonus += this.basicAttackBonus;
                break;
            case SkillType.SKILL:
                bonus += this.skillBonus;
                break;
            case SkillType.ULTIMATE:
                bonus += this.ultimateBonus;
                break;
            case SkillType.SPECIAL:
                bonus += this.followUpBonus;
                break;
        }
        
        return bonus;
    }

    shouldDecrease(currentCharacter, currentTurnIndex, gameState) {
        if (this.turnType === 'all') {
            return true;
        } else if (this.turnType === 'self') {
            // 使用UUID进行比较，确保同名单位不会互相影响
            return this.owner && currentCharacter.uuid === this.owner.uuid;
        }
        return true;
    }

    getDurationDescription() {
        return this.duration > 0 ? `${this.duration}` : '持续';
    }
}

window.StatusEffect = StatusEffect;