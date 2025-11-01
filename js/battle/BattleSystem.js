class BattleSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.skillExecutor = new SkillExecutor();
    }

    executeSkill(skill, user, target = null) {
        // 处理战技点消耗/回复
        if (skill.PointCost !== 0) {
            if (skill.PointCost > 0) {
                // 正数：消耗战技点
                if (!user.usePoint(skill.PointCost)) {
                    return true;
                }
            } else if (skill.PointCost < 0) {
                // 负数：回复战技点
                const PointGain = Math.abs(skill.PointCost);
                user.gainPoint(PointGain);
            }
        }

        const allCharacters = this.gameState.characters;
        return this.skillExecutor.execute(skill, user, target, allCharacters);
    }

    autoSelectTarget(skill, user) {
        const allCharacters = this.gameState.characters;
        const allies = this.gameState.getAllies().filter(c => c.currentHp > 0);
        const enemies = this.gameState.getEnemies().filter(c => c.currentHp > 0);

        if (skill.hasTag(SkillTag.HEAL) || skill.hasTag(SkillTag.BUFF)) {
            // 优先治疗/增益自己，若有低血友方再优先
            const lowHpAlly = allies.find(a => a.currentHp / a.maxHp < 0.5);
            return lowHpAlly || user;
        }

        if (skill.hasTag(SkillTag.ATTACK) || skill.hasTag(SkillTag.DEBUFF)) {
            // 攻击或减益技能优先攻击低血敌人
            enemies.sort((a, b) => a.currentHp - b.currentHp);
            return enemies[0] || null;
        }

        // 默认选择自己
        return user;
    }

    isSkillAvailable(skill, user) {
        // 检查战技点
        if (user.currentPoint < skill.PointCost) {
            return false;
        }

        // 检查角色是否可以行动
        if (!user.canAct()) {
            return false;
        }

        // 检查技能特定的 filter 条件
        if (skill.filter && typeof skill.filter === 'function') {
            const allCharacters = this.gameState.characters;
            const filterResult = skill.filter(user, null, allCharacters);
            if (!filterResult) {
                return false;
            }
        }

        console.log(`技能可用`);
        return true;
    }

    executeEnemyTurn(enemy) {
        console.log(`${enemy.name} 开始行动`);

        const availableSkills = this.getAvailableSkills(enemy);
        if (availableSkills.length === 0) {
            return true;
        }

        const skill = this.selectEnemySkill(enemy, availableSkills);
        if (!skill) {
            return true;
        }

        const target = this.selectEnemyTarget(enemy, skill);
        if (!target && skill.targetType === TargetType.SINGLE) {
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

            switch (skill.skillType) {
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

            if (enemy.currentPoint >= skill.PointCost * 2) {
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