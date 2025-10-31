// 定义全局枚举
const TargetType = {
    SINGLE: 'single',
    ALL_ENEMIES: 'all_enemies',
    ALL_ALLIES: 'all_allies',
    ALL: 'all',
    SELF: 'self'
};

const SkillType = {
    BASIC: 'basic',
    SKILL: 'skill',
    ULTIMATE: 'ultimate',
    SPECIAL: 'special'
};

// 伤害类型枚举
const DamageType = {
    PHYSICAL: 'physical',
    FIRE: 'fire',
    ICE: 'ice',
    LIGHTNING: 'lightning',
    QUANTUM: 'quantum',
    IMAGINARY: 'imaginary',
    WIND: 'wind',
    PURE: 'pure'
};

// 技能标签枚举
const SkillTag = {
    ATTACK: 'attack',
    HEAL: 'heal',
    BUFF: 'buff',
    DEBUFF: 'debuff',
    CONTROL: 'control',
    SUMMON: 'summon',
    FIELD: 'field',
    COUNTER: 'counter',
    FOLLOW_UP: 'follow_up',
    BREAK: 'break',
    AOE: 'aoe',
    SINGLE_TARGET: 'single_target'
};

// 设为全局变量
window.TargetType = TargetType;
window.SkillType = SkillType;
window.DamageType = DamageType;
window.SkillTag = SkillTag;

class Skill {
    constructor(name, description, energyCost, targetType, skillType,
        damageType = DamageType.PHYSICAL, tags = [], icon = "🔮", executeFunc = null) {
        this.name = name;
        this.description = description;
        this.energyCost = energyCost;
        this.targetType = targetType;
        this.skillType = skillType;
        this.damageType = damageType;
        this.tags = Array.isArray(tags) ? tags : [];
        this.icon = icon;
        this.executeFunc = executeFunc;
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

    getDamageTypeColor() {
        const colors = {
            [DamageType.PHYSICAL]: '#ff6b6b',
            [DamageType.FIRE]: '#ff8e53',
            [DamageType.ICE]: '#4fc3f7',
            [DamageType.LIGHTNING]: '#ffd166',
            [DamageType.QUANTUM]: '#ba68c8',
            [DamageType.IMAGINARY]: '#9575cd',
            [DamageType.WIND]: '#81c784',
            [DamageType.PURE]: '#e0e0e0'
        };
        return colors[this.damageType] || '#ffffff';
    }

    getTagColor(tag) {
        const colors = {
            [SkillTag.ATTACK]: '#ff4d7a',
            [SkillTag.HEAL]: '#00ff88',
            [SkillTag.BUFF]: '#a78bfa',
            [SkillTag.DEBUFF]: '#ff8e53',
            [SkillTag.CONTROL]: '#ffd166',
            [SkillTag.SUMMON]: '#9575cd',
            [SkillTag.FIELD]: '#81c784',
            [SkillTag.COUNTER]: '#4fc3f7',
            [SkillTag.FOLLOW_UP]: '#ba68c8',
            [SkillTag.BREAK]: '#ff6b6b',
            [SkillTag.AOE]: '#ff8e53',
            [SkillTag.SINGLE_TARGET]: '#4fc3f7'
        };
        return colors[tag] || '#b0b0ff';
    }

    // 修复：确保这个方法存在
    requiresTargetSelection() {
        return this.targetType === TargetType.SINGLE || this.targetType === TargetType.SPREAD;
    }

    // 修复：确保这个方法存在
    getTargetDescription() {
        const descriptions = {
            [TargetType.SINGLE]: '单体目标',
            [TargetType.ALL_ENEMIES]: '全体敌人',
            [TargetType.ALL_ALLIES]: '全体友方',
            [TargetType.ALL]: '全体目标',
            [TargetType.SELF]: '自身',
            [TargetType.SPREAD]: '扩散攻击',
            [TargetType.BOUNCE]: '弹射攻击'
        };
        return descriptions[this.targetType] || '未知目标';
    }
}

window.Skill = Skill;