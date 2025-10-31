(function() {
    const TrailblazerTemplate = {
        name: "紧缩者",
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

    window.TrailblazerTemplate = TrailblazerTemplate;

    window.registerTrailblazer = function(loader) {
        loader.registerCharacterTemplate("Trailblazer", TrailblazerTemplate);
        const character = loader.createCharacter("Trailblazer");

        const followUp = new Skill(
            "星芒追击",
            "对目标发动100%攻击力的追击",
            0,
            TargetType.SINGLE,
            SkillType.SPECIAL,
            DamageType.PHYSICAL,
            [SkillTag.ATTACK, SkillTag.SINGLE_TARGET, SkillTag.FOLLOW_UP],
            "⭐",
            loader.skillExecutor.getSkillFunction("executeAttackSkill")
        );

        character.setFollowUpAttack(
            followUp,
            0.3,
            [{ type: "afterSkill", skillTypes: [SkillType.BASIC] }]
        );
        return character;
    };
})();
