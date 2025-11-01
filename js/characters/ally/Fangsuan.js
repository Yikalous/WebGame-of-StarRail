(function () {
    // ===== 角色模板 =====
    const FangsuanTemplate = {
        name: "钫酸",
        type: "ally",
        maxHp: 4213,
        attack: 4337,
        defense: 1200,
        speed: 137,
        critRate: 0.4,
        critDamage: 0.8,
        maxPoint: 5,
        icon: "🧙",
        skills: [
            {
                name: "平凡一击",
                description: "对敌方主目标造成量子伤害",
                targetType: TargetType.SINGLE,
                skillType: SkillType.BASIC,
                tags: [SkillTag.ATTACK, SkillTag.SINGLE_TARGET],
                icon: "⚔️",
                PointCost: -3,
                executeFunc: function (user, target, allCharacters) {
                    const enemies = allCharacters.filter(c => c.type === 'enemy' && c.currentHp > 0);
                    const actualTarget = target || (enemies.length > 0 ? enemies[0] : null);

                    if (actualTarget) {
                        user.Attack("SINGLE", "attack", [1100], [3.0], actualTarget, DamageType.QUANTUM, [DamageStyle.BASIC]);
                    } else {
                        user.Log("没有可攻击的目标", 'debuff');
                    }
                }
            },
            {
                name: "死之剑",
                description: "前劈宝剑，发出剑气",
                targetType: TargetType.SINGLE,
                skillType: SkillType.SPECIAL,
                tags: [SkillTag.ATTACK, SkillTag.SPREAD, SkillTag.BREAK],
                icon: "⚰️",
                filter: function (user, target, allCharacters) {  // 修正为3个参数
                    return user.hasStatusEffect("无敌之王的加冕");
                },
                PointCost: 0,
                executeFunc: function (user, target, allCharacters) {
                    const enemies = allCharacters.filter(c => c.type === 'enemy' && c.currentHp > 0);
                    const mainTarget = target || enemies[0];
                    if (!mainTarget) {
                        user.Log("没有可攻击的目标", 'warn');
                        return;
                    }

                    // SPREAD攻击逻辑：主目标+溅射
                    user.Attack("SPREAD", "attack", [2250, 1250], [2.0, 3.0], mainTarget, DamageType.QUANTUM, [DamageStyle.SPREAD]);
                }
            },
            {
                name: "终结技 - 生死别离",
                description: "自身获得无敌，敌方全体受到伤害提升",
                PointCost: 3,
                targetType: TargetType.ALL,
                skillType: SkillType.ULTIMATE,
                tags: [SkillTag.BUFF, SkillTag.DEBUFF, SkillTag.FIELD],
                icon: "💫",
                executeFunc: function (user, target, allCharacters) {
                    // 使用完善后的 addStatusEffect 方法
                    user.addStatusEffect("无敌之王的加冕", "immune", true, 3, 'self', 'end');
                    user.addStatusEffect("圣剑的祝福", "damageBonus", 15, 3, 'self', 'end');

                    allCharacters.forEach(c => {
                        if (c.type === 'enemy') {
                            c.addStatusEffect("死之剑的诅咒", "damageTakenBonus", 10.0, 3, 'self', 'end');
                        }
                    });

                    user.Log(`${user.name} 释放终结技：生死别离！`, 'buff');
                }
            },
        ]
    };

    window.FangsuanTemplate = FangsuanTemplate;

    window.registerFangsuan = function (loader) {
        loader.registerCharacterTemplate("Fangsuan", FangsuanTemplate);
        // 不创建实例，只注册模板
        // return loader.createCharacter("Fangsuan");
    };
})();