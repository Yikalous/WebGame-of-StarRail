// 所有角色模板定义在一个文件中
const FangsuanTemplate = {
    name: "钫酸",
    type: "ally",
    maxHp: 4213,
    attack: 4337,
    critRate: 0.4,
    critDamage: 0.8,
    maxEnergy: 5,
    icon: "🧙",
    damageResistances: {
        [DamageType.QUANTUM]: 0.3,
        [DamageType.IMAGINARY]: 0.2
    },
    skills: [
        {
            name: "普通攻击",
            description: "对敌方单体造成100%攻击力的量子伤害",
            energyCost: 0,
            targetType: TargetType.SINGLE,
            skillType: SkillType.BASIC,
            damageType: DamageType.QUANTUM,
            tags: [SkillTag.ATTACK, SkillTag.SINGLE_TARGET],
            icon: "⚔️",
            executeFunc: "basicAttack"
        },
        {
            name: "战技",
            description: "对敌方全体造成200%攻击力的量子伤害",
            energyCost: 1,
            targetType: TargetType.ALL_ENEMIES,
            skillType: SkillType.SKILL,
            damageType: DamageType.QUANTUM,
            tags: [SkillTag.ATTACK, SkillTag.AOE],
            icon: "✨",
            executeFunc: "fangsuSkill"
        },
        {
            name: "终结技 - 生死别离",
            description: "召唤宝剑，提供强大增益和减益效果",
            energyCost: 3,
            targetType: TargetType.ALL,
            skillType: SkillType.ULTIMATE,
            damageType: DamageType.PURE,
            tags: [SkillTag.BUFF, SkillTag.DEBUFF, SkillTag.FIELD],
            icon: "💫",
            executeFunc: "fangsuUltimate"
        },
        {
            name: "死之剑",
            description: "前劈宝剑，发出无敌贯穿剑气",
            energyCost: 0,
            targetType: TargetType.ALL_ENEMIES,
            skillType: SkillType.SPECIAL,
            damageType: DamageType.PURE,
            tags: [SkillTag.ATTACK, SkillTag.AOE, SkillTag.BREAK],
            icon: "⚰️",
            executeFunc: "fangsuDeathSword"
        }
    ]
};

const AntimatterLegionTemplate = {
    name: "反物质军团",
    type: "enemy",
    maxHp: 40000000,
    attack: 250,
    critRate: 0.2,
    critDamage: 0.5,
    maxEnergy: 3,
    icon: "👾",
    damageResistances: {
        [DamageType.PHYSICAL]: 0.1,
        [DamageType.FIRE]: -0.2
    },
    skills: [
        {
            name: "普通攻击",
            description: "对敌方单体造成100%攻击力的物理伤害",
            energyCost: 0,
            targetType: TargetType.SINGLE,
            skillType: SkillType.BASIC,
            damageType: DamageType.PHYSICAL,
            tags: [SkillTag.ATTACK, SkillTag.SINGLE_TARGET],
            icon: "⚔️",
            executeFunc: "basicAttack"
        },
        {
            name: "能量冲击",
            description: "对敌方单体造成150%攻击力的雷属性伤害",
            energyCost: 1,
            targetType: TargetType.SINGLE,
            skillType: SkillType.SKILL,
            damageType: DamageType.LIGHTNING,
            tags: [SkillTag.ATTACK, SkillTag.SINGLE_TARGET],
            icon: "✨",
            executeFunc: "basicAttack"
        }
    ]
};

const TrailblazerTemplate = {
    name: "开拓者",
    type: "ally",
    maxHp: 3500,
    attack: 2800,
    critRate: 0.3,
    critDamage: 0.6,
    maxEnergy: 5,
    icon: "🚀",
    damageResistances: {
        [DamageType.FIRE]: 0.1,
        [DamageType.ICE]: 0.1
    },
    skills: [
        {
            name: "普通攻击",
            description: "对敌方单体造成100%攻击力的物理伤害",
            energyCost: 0,
            targetType: TargetType.SINGLE,
            skillType: SkillType.BASIC,
            damageType: DamageType.PHYSICAL,
            tags: [SkillTag.ATTACK, SkillTag.SINGLE_TARGET],
            icon: "⚔️",
            executeFunc: "basicAttack"
        },
        {
            name: "星芒扩散",
            description: "对主目标造成150%伤害，并对周围敌人造成100%扩散伤害",
            energyCost: 1,
            targetType: TargetType.SPREAD,
            skillType: SkillType.SKILL,
            damageType: DamageType.FIRE,
            tags: [SkillTag.ATTACK, SkillTag.AOE],
            icon: "✨",
            executeFunc: "spreadAttack"
        },
        {
            name: "星穹爆发",
            description: "对敌方单体造成300%攻击力的虚数伤害",
            energyCost: 3,
            targetType: TargetType.SINGLE,
            skillType: SkillType.ULTIMATE,
            damageType: DamageType.IMAGINARY,
            tags: [SkillTag.ATTACK, SkillTag.SINGLE_TARGET, SkillTag.BREAK],
            icon: "💫",
            executeFunc: "basicAttack"
        },
        {
            name: "战意激发",
            description: "为自己施加普通攻击和战技伤害加成",
            energyCost: 1,
            targetType: TargetType.SELF,
            skillType: SkillType.SKILL,
            damageType: DamageType.PURE,
            tags: [SkillTag.BUFF],
            icon: "🔥",
            executeFunc: "buffSkill"
        }
    ]
};

const SilverWolfTemplate = {
    name: "银狼",
    type: "ally",
    maxHp: 3200,
    attack: 3000,
    critRate: 0.35,
    critDamage: 0.7,
    maxEnergy: 5,
    icon: "🐺",
    damageResistances: {
        [DamageType.ICE]: 0.2,
        [DamageType.WIND]: 0.1
    },
    skills: [
        {
            name: "普通攻击",
            description: "对敌方单体造成100%攻击力的冰属性伤害",
            energyCost: 0,
            targetType: TargetType.SINGLE,
            skillType: SkillType.BASIC,
            damageType: DamageType.ICE,
            tags: [SkillTag.ATTACK, SkillTag.SINGLE_TARGET],
            icon: "⚔️",
            executeFunc: "basicAttack"
        },
        {
            name: "雷电弹射",
            description: "在敌人间随机弹射3-5次，每次造成80%雷属性伤害",
            energyCost: 1,
            targetType: TargetType.BOUNCE,
            skillType: SkillType.SKILL,
            damageType: DamageType.LIGHTNING,
            tags: [SkillTag.ATTACK, SkillTag.AOE],
            icon: "⚡",
            executeFunc: "bounceAttack"
        },
        {
            name: "治疗之雨",
            description: "为所有友方恢复80%攻击力的生命值",
            energyCost: 2,
            targetType: TargetType.ALL_ALLIES, // 改为全体友方，不需要选择目标
            skillType: SkillType.SKILL,
            damageType: DamageType.PURE,
            tags: [SkillTag.HEAL, SkillTag.AOE],
            icon: "💧",
            executeFunc: "healSkill"
        }
    ]
};

// 设为全局变量
window.FangsuanTemplate = FangsuanTemplate;
window.AntimatterLegionTemplate = AntimatterLegionTemplate;
window.TrailblazerTemplate = TrailblazerTemplate;
window.SilverWolfTemplate = SilverWolfTemplate;