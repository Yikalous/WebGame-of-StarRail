class BattleSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.skillExecutor = new SkillExecutor();
    }

    executeSkill(skill, user, target = null) {
        console.log(`执行技能: ${skill.name}, 目标类型: ${skill.targetType}, 指定目标:`, target);
        
        // 检查能量是否足够
        if (skill.energyCost > 0 && !user.useEnergy(skill.energyCost)) {
            user.gameState.addLog(`${user.name}能量不足，无法使用${skill.name}`, 'energy');
            return true;
        }

        const allCharacters = this.gameState.characters;

        // 根据技能目标类型执行
        switch (skill.targetType) {
            case TargetType.SINGLE:
                if (target) {
                    return skill.execute(user, target, allCharacters);
                } else {
                    // 对于单体技能，如果没有指定目标，自动选择一个
                    const autoTarget = this.autoSelectTarget(skill, user);
                    if (autoTarget) {
                        return skill.execute(user, autoTarget, allCharacters);
                    } else {
                        user.gameState.addLog(`${user.name}没有找到合适的目标`, 'debuff');
                        return true;
                    }
                }

            case TargetType.SPREAD:
                if (target) {
                    return skill.execute(user, target, allCharacters);
                } else {
                    // 对于扩散技能，如果没有指定目标，自动选择一个
                    const autoTarget = this.autoSelectTarget(skill, user);
                    if (autoTarget) {
                        return skill.execute(user, autoTarget, allCharacters);
                    } else {
                        user.gameState.addLog(`${user.name}没有找到合适的目标`, 'debuff');
                        return true;
                    }
                }

            case TargetType.ALL_ENEMIES:
                // 全体敌人技能不需要指定目标
                return skill.execute(user, null, allCharacters);

            case TargetType.ALL_ALLIES:
                // 全体友方技能不需要指定目标
                return skill.execute(user, null, allCharacters);

            case TargetType.ALL:
                // 全体技能不需要指定目标
                return skill.execute(user, null, allCharacters);

            case TargetType.SELF:
                // 自身技能不需要指定目标
                return skill.execute(user, user, allCharacters);

            case TargetType.BOUNCE:
                // 弹射技能不需要指定目标
                return skill.execute(user, null, allCharacters);

            default:
                console.error('未知的目标类型:', skill.targetType);
                return true;
        }
    }

    autoSelectTarget(skill, user) {
        console.log('自动选择目标，技能:', skill.name, '标签:', skill.tags);
        
        if (skill.hasTag(SkillTag.HEAL) || skill.hasTag(SkillTag.BUFF)) {
            // 治疗和增益技能默认选择自己
            console.log('选择自己作为目标');
            return user;
        } else if (skill.hasTag(SkillTag.ATTACK)) {
            // 攻击技能选择第一个存活的敌人
            const enemies = this.gameState.getEnemies().filter(enemy => enemy.currentHp > 0);
            const target = enemies.length > 0 ? enemies[0] : null;
            console.log('选择敌人作为目标:', target?.name);
            return target;
        }
        
        console.log('没有找到合适的目标');
        return null;
    }

    isSkillAvailable(skill, user) {
        console.log(`检查技能可用性: ${skill.name}, 需要能量: ${skill.energyCost}, 当前能量: ${user.currentEnergy}`);
        
        // 检查能量
        if (user.currentEnergy < skill.energyCost) {
            console.log(`能量不足: 需要 ${skill.energyCost}, 只有 ${user.currentEnergy}`);
            return false;
        }

        // 使用新的技能可用性检查
        if (!user.canUseSkill(skill.skillType)) {
            console.log(`技能被沉默或无法使用`);
            return false;
        }

        // 特殊技能可用性检查
        if (user.name === "钫酸" && skill.skillType === SkillType.SPECIAL && !user.isSwordActive) {
            console.log(`钫酸的特殊技能未激活`);
            return false;
        }

        console.log(`技能可用`);
        return true;
    }

    executeEnemyTurn(enemy) {
        console.log(`${enemy.name} 开始行动`);
        
        const availableSkills = this.getAvailableSkills(enemy);
        if (availableSkills.length === 0) {
            this.gameState.addLog(`${enemy.name} 没有可用技能，跳过回合`, 'debuff');
            return true;
        }

        const skill = this.selectEnemySkill(enemy, availableSkills);
        if (!skill) {
            this.gameState.addLog(`${enemy.name} 无法决定使用什么技能`, 'debuff');
            return true;
        }

        const target = this.selectEnemyTarget(enemy, skill);
        if (!target && skill.targetType === TargetType.SINGLE) {
            this.gameState.addLog(`${enemy.name} 没有找到合适的目标`, 'debuff');
            return true;
        }

        console.log(`${enemy.name} 使用 ${skill.name} 攻击 ${target ? target.name : '全体'}`);
        const allSurvived = this.executeSkill(skill, enemy, target);
        
        return allSurvived;
    }

    getAvailableSkills(character) {
        return Object.values(character.skills).filter(skill => 
            this.isSkillAvailable(skill, character)
        );
    }

    selectEnemySkill(enemy, availableSkills) {
        const usableSkills = availableSkills.filter(skill => 
            enemy.canUseSkill(skill.skillType)
        );

        if (usableSkills.length === 0) {
            return null;
        }

        const skillWeights = usableSkills.map(skill => {
            let weight = 0;
            
            switch(skill.skillType) {
                case SkillType.BASIC:
                    weight = 1;
                    break;
                case SkillType.SKILL:
                    weight = 2;
                    break;
                case SkillType.ULTIMATE:
                    weight = 4;
                    break;
                case SkillType.SPECIAL:
                    weight = 3;
                    break;
            }

            if (enemy.currentEnergy >= skill.energyCost * 2) {
                weight += 1;
            }

            return { skill, weight };
        });

        skillWeights.sort((a, b) => b.weight - a.weight);
        
        return skillWeights.length > 0 ? skillWeights[0].skill : usableSkills[0];
    }

    selectEnemyTarget(enemy, skill) {
        if (skill.targetType !== TargetType.SINGLE) {
            return null;
        }

        const allies = this.gameState.getAllies().filter(ally => ally.currentHp > 0);
        if (allies.length === 0) {
            return null;
        }

        allies.sort((a, b) => a.currentHp - b.currentHp);
        return allies[0];
    }

    isPlayerTurn() {
        const currentCharacter = this.gameState.characters[this.gameState.currentTurnIndex];
        return currentCharacter.type === 'ally';
    }
}

window.BattleSystem = BattleSystem;