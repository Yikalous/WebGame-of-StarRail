(function() {
    const AntimatterLegionTemplate = {
        name: "正物质军团",
        type: "enemy",
        maxHp: 4000000,
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
                description: "对敌方单体造成物理伤害",
                targetType: TargetType.SINGLE,
                skillType: SkillType.BASIC,
                tags: [SkillTag.ATTACK, SkillTag.SINGLE_TARGET],
                icon: "⚔️",
                executeFunc: function(user, target) {
                    user.Attack("SINGLE", "attack", [0], [1.0], target || user, DamageType.PHYSICAL);
                }
            },
            {
                name: "能量冲击",
                description: "对敌方单体造成雷属性伤害",
                energyCost: 1,
                targetType: TargetType.SINGLE,
                skillType: SkillType.SKILL,
                tags: [SkillTag.ATTACK, SkillTag.SINGLE_TARGET],
                icon: "✨",
                executeFunc: function(user, target) {
                    user.Attack("SINGLE", "attack", [0], [1.5], target || user, DamageType.LIGHTNING);
                }
            }
        ]
    };

    window.AntimatterLegionTemplate = AntimatterLegionTemplate;

    window.registerAntimatterLegion = function(loader) {
        loader.registerCharacterTemplate("AntimatterLegion", AntimatterLegionTemplate);
        return loader.createCharacter("AntimatterLegion");
    };
})();