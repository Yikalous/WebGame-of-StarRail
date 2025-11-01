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

window.TargetType = TargetType;
window.SkillType = SkillType;
window.DamageType = DamageType;
window.SkillTag = SkillTag;