class StatusEffect {
    constructor(name, duration, 
                damageBonus = 0,
                basicAttackBonus = 0,
                skillBonus = 0,
                ultimateBonus = 0,
                followUpBonus = 0,
                damageTakenBonus = 0,
                isImmuneDeath = false,
                isSilenced = false,
                isStunned = false) {
        this.name = name;
        this.duration = duration;
        this.damageBonus = damageBonus;
        this.basicAttackBonus = basicAttackBonus;
        this.skillBonus = skillBonus;
        this.ultimateBonus = ultimateBonus;
        this.followUpBonus = followUpBonus;
        this.damageTakenBonus = damageTakenBonus;
        this.isImmuneDeath = isImmuneDeath;
        this.isSilenced = isSilenced;
        this.isStunned = isStunned;
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
}

window.StatusEffect = StatusEffect;