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

    loadDefaultCharacters() {
        this.registerCharacterTemplate('Fangsuan', FangsuanTemplate);
        this.registerCharacterTemplate('AntimatterLegion', AntimatterLegionTemplate);
        this.registerCharacterTemplate('Trailblazer', TrailblazerTemplate);
        this.registerCharacterTemplate('SilverWolf', SilverWolfTemplate);

        const characters = [];
        
        characters.push(this.createCharacter('Fangsuan'));
        characters.push(this.createCharacter('Trailblazer'));
        characters.push(this.createCharacter('SilverWolf'));
        
        characters.push(this.createCharacter('AntimatterLegion'));
        characters.push(this.createCharacter('AntimatterLegion'));
        characters.push(this.createCharacter('AntimatterLegion'));
        
        return characters.filter(char => char !== null);
    }

    setupFollowUpAttacks(character, characterName) {
        switch (characterName) {
            case 'SilverWolf':
                const silverWolfFollowUp = new Skill(
                    "狼魂追击",
                    "对目标发动120%攻击力的追加攻击",
                    0,
                    TargetType.SINGLE,
                    SkillType.SPECIAL,
                    DamageType.ICE,
                    [SkillTag.ATTACK, SkillTag.SINGLE_TARGET, SkillTag.FOLLOW_UP],
                    "🐾",
                    this.skillExecutor.getSkillFunction('silverWolfFollowUp')
                );
                character.setFollowUpAttack(
                    silverWolfFollowUp,
                    0.4,
                    [
                        { type: 'targetHpBelow', value: 0.5 }
                    ]
                );
                break;

            case 'Trailblazer':
                const trailblazerFollowUp = new Skill(
                    "星芒追击",
                    "对目标发动100%攻击力的追击",
                    0,
                    TargetType.SINGLE,
                    SkillType.SPECIAL,
                    DamageType.PHYSICAL,
                    [SkillTag.ATTACK, SkillTag.SINGLE_TARGET, SkillTag.FOLLOW_UP],
                    "⭐",
                    this.skillExecutor.getSkillFunction('executeAttackSkill') // 使用通用的攻击函数
                );
                character.setFollowUpAttack(
                    trailblazerFollowUp,
                    0.3,
                    [
                        { type: 'afterSkill', skillTypes: [SkillType.BASIC] }
                    ]
                );
                break;

            case 'Fangsuan':
                const fangsuanFollowUp = new Skill(
                    "剑意追击",
                    "宝剑引导的追加攻击，造成80%攻击力的量子伤害",
                    0,
                    TargetType.SINGLE,
                    SkillType.SPECIAL,
                    DamageType.QUANTUM,
                    [SkillTag.ATTACK, SkillTag.SINGLE_TARGET, SkillTag.FOLLOW_UP],
                    "⚔️",
                    this.skillExecutor.getSkillFunction('executeAttackSkill') // 使用通用的攻击函数
                );
                character.setFollowUpAttack(
                    fangsuanFollowUp,
                    0,
                    []
                );
                break;
        }
    }
}

window.CharacterLoader = CharacterLoader;