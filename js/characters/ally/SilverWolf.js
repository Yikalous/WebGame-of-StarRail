(function() {
    const SilverWolfTemplate = {
        name: "金狼",
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
                targetType: TargetType.ALL_ALLIES,
                skillType: SkillType.SKILL,
                damageType: DamageType.PURE,
                tags: [SkillTag.HEAL, SkillTag.AOE],
                icon: "💧",
                executeFunc: "healSkill"
            }
        ]
    };

    window.SilverWolfTemplate = SilverWolfTemplate;

    window.registerSilverWolf = function(loader) {
        loader.registerCharacterTemplate("SilverWolf", SilverWolfTemplate);
        const character = loader.createCharacter("SilverWolf");

        const followUp = new Skill(
            "狼魂追击",
            "对目标发动120%攻击力的追加攻击",
            0,
            TargetType.SINGLE,
            SkillType.SPECIAL,
            DamageType.ICE,
            [SkillTag.ATTACK, SkillTag.SINGLE_TARGET, SkillTag.FOLLOW_UP],
            "🐾",
            loader.skillExecutor.getSkillFunction("silverWolfFollowUp")
        );

        character.setFollowUpAttack(
            followUp,
            0.4,
            [{ type: "targetHpBelow", value: 0.5 }]
        );
        return character;
    };
})();