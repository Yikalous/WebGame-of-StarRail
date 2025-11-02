class CharacterLoader {
    constructor(skillExecutor) {
        this.skillExecutor = skillExecutor;
        this.characterTemplates = {};
    }

    registerCharacterTemplate(name, template) {
        this.characterTemplates[name] = template;
    }

    createCharacter(characterName) {
        const template = this.characterTemplates[characterName];
        if (!template) {
            console.error(`角色模板未找到: ${characterName}`);
            return null;
        }

        // 确保技能是数组
        const skills = [];

        // 检查 template.skills 是否存在且是数组
        if (Array.isArray(template.skills)) {
            template.skills.forEach(skillConfig => {
                let executeFunc = null;
                if (typeof skillConfig.executeFunc === 'function') {
                    executeFunc = skillConfig.executeFunc;
                } else {
                    executeFunc = () => {
                        console.warn(`${skillConfig.name} 技能尚未实现`);
                    };
                }

                const tags = Array.isArray(skillConfig.tags) ? skillConfig.tags : [];

                skills.push(new Skill(
                    skillConfig.name,
                    skillConfig.description,
                    skillConfig.PointCost || 0,
                    skillConfig.targetType,
                    skillConfig.skillType,
                    skillConfig.damageType || DamageType.PHYSICAL,
                    tags,
                    skillConfig.icon,
                    executeFunc,
                    skillConfig.filter  // 传入 filter 函数
                ));
            });
        } else {
            console.warn(`角色 ${characterName} 没有定义技能`);
        }

        const character = new Character(
            template.name,
            template.type,
            template.maxHp,
            template.attack,
            template.defense || 0,
            template.speed || 100,
            template.critRate,
            template.critDamage,
            template.maxPoint,
            skills,
            template.icon,
            template.image || "",
        );
        
        // 复制tag属性（如果模板中有定义）
        if (template.tag !== undefined) {
            character.tag = template.tag;
        }
        
        // 添加被动技能（如果模板中有定义）
        if (template.passiveSkills) {
            // 深拷贝被动技能，但需要从原始模板中获取函数引用
            character.passiveSkills = JSON.parse(JSON.stringify(template.passiveSkills));
            
            // 从原始模板中保存函数引用（因为 JSON 序列化会丢失函数）
            const templatePassiveSkills = template.passiveSkills;
            
            // 绑定荒弥的被动技能
            if (character.passiveSkills && character.passiveSkills.limpingAlone && templatePassiveSkills.limpingAlone) {
                const limpingAlone = character.passiveSkills.limpingAlone;
                const originalOnAllyDeath = templatePassiveSkills.limpingAlone.onAllyDeath; // 从模板中获取原始函数
                if (originalOnAllyDeath && typeof originalOnAllyDeath === 'function') {
                    character.passiveSkills.limpingAlone.onAllyDeath = function(huangmi, deadAlly, allCharacters) {
                        return originalOnAllyDeath.call(limpingAlone, huangmi, deadAlly, allCharacters);
                    };
                }
            }
            
            // 绑定逾柿的被动技能
            if (character.passiveSkills && character.passiveSkills.eyeRecall && templatePassiveSkills.eyeRecall) {
                const eyeRecall = character.passiveSkills.eyeRecall;
                const originalOnFatalDamage = templatePassiveSkills.eyeRecall.onFatalDamage; // 从模板中获取原始函数
                if (originalOnFatalDamage && typeof originalOnFatalDamage === 'function') {
                    character.passiveSkills.eyeRecall.onFatalDamage = function(yushi, allCharacters) {
                        return originalOnFatalDamage.call(eyeRecall, yushi, allCharacters);
                    };
                }
            }
            
            // 绑定逾柿的亡语效果
            if (character.passiveSkills && character.passiveSkills.deathRattle && templatePassiveSkills.deathRattle) {
                const deathRattle = character.passiveSkills.deathRattle;
                const originalOnTurnStart = templatePassiveSkills.deathRattle.onTurnStart; // 从模板中获取原始函数
                if (originalOnTurnStart && typeof originalOnTurnStart === 'function') {
                    character.passiveSkills.deathRattle.onTurnStart = function(yushi, allCharacters, gameState) {
                        return originalOnTurnStart.call(deathRattle, yushi, allCharacters, gameState);
                    };
                }
            }
        }
        
        return character;
    }

    loadCharacters(names = []) {
        const characters = [];
        for (const name of names) {
            const character = this.createCharacter(name);
            if (character) characters.push(character);
        }
        return characters;
    }
}

window.CharacterLoader = CharacterLoader;