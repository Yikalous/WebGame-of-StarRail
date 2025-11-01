class Skill {
    constructor(name, description, PointCost, targetType, skillType,
        damageType = DamageType.PHYSICAL, tags = [], icon = "🔮", executeFunc = null, filter = null) {  // 添加 filter 参数
        this.name = name;
        this.description = description;
        this.PointCost = PointCost || 0;
        this.targetType = targetType;
        this.skillType = skillType;
        this.damageType = damageType;
        this.tags = Array.isArray(tags) ? tags : [];
        this.icon = icon;
        this.executeFunc = executeFunc;
        this.filter = filter;  // 设置 filter 属性
    }

    execute(user, target = null, allCharacters = null) {
        if (this.executeFunc) {
            return this.executeFunc(user, target, allCharacters);
        }
        return true;
    }

    hasTag(tag) {
        return Array.isArray(this.tags) && this.tags.includes(tag);
    }

    // 添加缺失的方法
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

    getTagColor(tag) {
        const colors = {
            [SkillTag.ATTACK]: '#ff4d7a',
            [SkillTag.HEAL]: '#00ff88',
            [SkillTag.BUFF]: '#a78bfa',
            [SkillTag.DEBUFF]: '#ff8e53',
            [SkillTag.CONTROL]: '#ffd166',
            [SkillTag.AOE]: '#5d7cff'
        };
        return colors[tag] || '#8080cc';
    }

    getDamageTypeColor() {
        const colors = {
            [DamageType.PHYSICAL]: '#ff6b6b',
            [DamageType.FIRE]: '#ff8e53',
            [DamageType.ICE]: '#5d7cff',
            [DamageType.LIGHTNING]: '#ffd166',
            [DamageType.QUANTUM]: '#a78bfa',
            [DamageType.IMAGINARY]: '#ff6b9d'
        };
        return colors[this.damageType] || '#b0b0ff';
    }
}

window.Skill = Skill;