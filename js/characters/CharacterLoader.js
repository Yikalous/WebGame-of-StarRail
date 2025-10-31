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

        const skills = {};
        template.skills.forEach(skillConfig => {
            const executeFunc = this.skillExecutor.getSkillFunction(skillConfig.executeFunc);
            const tags = Array.isArray(skillConfig.tags) ? skillConfig.tags : [];
            
            skills[skillConfig.skillType] = new Skill(
                skillConfig.name,
                skillConfig.description,
                skillConfig.energyCost,
                skillConfig.targetType,
                skillConfig.skillType,
                skillConfig.damageType || DamageType.PHYSICAL,
                tags,
                skillConfig.icon,
                executeFunc
            );
        });

        return new Character(
            template.name,
            template.type,
            template.maxHp,
            template.attack,
            template.critRate,
            template.critDamage,
            template.maxEnergy,
            skills,
            template.icon
        );
    }

    /** 
     * 根据配置创建多个角色实例
     * 由外部传入角色名数组
     */
    loadCharacters(names = []) {
        const characters = [];
        for (const name of names) {
            const character = this.createCharacter(name);
            if (character) {
                characters.push(character);
            }
        }
        return characters;
    }
}

window.CharacterLoader = CharacterLoader;