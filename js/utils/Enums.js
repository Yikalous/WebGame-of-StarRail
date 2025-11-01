// utils/Enums.js
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

const DamageStyle = {
    BASIC: 'basic',
    SKILL: 'skill',
    ULTIMATE: 'ultimate',
    SPECIAL: 'special',
    AOE: 'aoe',
    SPREAD: 'spread',
    BOUND: 'bound',
    ADDITION: 'addition',
    SINGLE: 'single',
    NONE: 'none',
    FOLLOW_UP: 'follow_up',   // 追击攻击
    BREAK: 'break',           // 击破伤害
    DOT: 'dot',               // 持续伤害
    REACTION: 'reaction',     // 反应伤害
    COUNTER: 'counter',       // 反击伤害
    ENVIRONMENT: 'environment', // 环境伤害
    PURE: 'pure',             // 纯粹伤害（无视防御）
    TRUE: 'true'              // 真实伤害（无视所有减免）
}

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
    SPREAD: 'spread',
    BOUND: 'bound',
    SINGLE_TARGET: 'single_target'
};

window.TargetType = TargetType;
window.SkillType = SkillType;
window.DamageType = DamageType;
window.SkillTag = SkillTag;
window.DamageStyle = DamageStyle;