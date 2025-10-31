(function() {
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

    window.FangsuanTemplate = FangsuanTemplate;

    window.registerFangsuan = function(loader) {
        loader.registerCharacterTemplate("Fangsuan", FangsuanTemplate);
        const character = loader.createCharacter("Fangsuan");

        const followUp = new Skill(
            "剑意追击",
            "宝剑引导的追加攻击，造成80%攻击力的量子伤害",
            0,
            TargetType.SINGLE,
            SkillType.SPECIAL,
            DamageType.QUANTUM,
            [SkillTag.ATTACK, SkillTag.SINGLE_TARGET, SkillTag.FOLLOW_UP],
            "⚔️",
            loader.skillExecutor.getSkillFunction("executeAttackSkill")
        );

        character.setFollowUpAttack(followUp, 0, []);
        return character;
    };
})();
