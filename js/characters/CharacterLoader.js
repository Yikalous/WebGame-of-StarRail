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
        
        // 添加被动技能（如果模板中有定义）
        if (template.passiveSkills) {
            character.passiveSkills = JSON.parse(JSON.stringify(template.passiveSkills));
            // 绑定上下文到被动技能方法
            if (character.passiveSkills && character.passiveSkills.limpingAlone) {
                const limpingAlone = character.passiveSkills.limpingAlone;
                character.passiveSkills.limpingAlone.onAllyDeath = function(huangmi, deadAlly, allCharacters) {
                    limpingAlone.onAllyDeath.call(limpingAlone, huangmi, deadAlly, allCharacters);
                };
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