class UIManager {
    constructor(gameState, battleSystem) {
        this.gameState = gameState;
        this.battleSystem = battleSystem;
        this.battleRenderer = new BattleRenderer();
        this.skillPanel = new SkillPanel();
        this.isProcessing = false;
        this.selectedSkill = null; // 当前选择的技能

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const resetBtn = document.getElementById('reset-game');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.gameState.resetGame();
                this.updateUI();
            });
        } else {
            console.warn('reset-game按钮未找到，可能选人界面尚未切换');
        }

        // 移除目标选择面板的相关代码
    }

    updateUI() {
        this.updateCharacterDisplay();
        this.updateCurrentTurn();
        this.updateSkillPanel();
        this.updateBattleLog();

        if (this.gameState.isGameOver) {
            this.showGameOver();
        } else {
            if (!this.gameState.isPlayerTurn && !this.isProcessing) {
                this.executeEnemyTurn();
            }
        }
    }

    executeEnemyTurn() {
        if (this.isProcessing) return;

        this.isProcessing = true;
        const currentEnemy = this.gameState.characters[this.gameState.currentTurnIndex];

        console.log(`执行 ${currentEnemy.name} 的回合`);

        setTimeout(() => {
            try {
                const allSurvived = this.battleSystem.executeEnemyTurn(currentEnemy);
                this.gameState.checkGameEnd();
                this.updateUI();

                if (!allSurvived) {
                    setTimeout(() => {
                        this.continueToNextTurn();
                    }, 1500);
                } else {
                    this.continueToNextTurn();
                }
            } catch (error) {
                console.error('执行敌人回合时出错:', error);
                this.continueToNextTurn();
            }
        }, 1000);
    }

    continueToNextTurn() {
        const isPlayerTurn = this.gameState.nextTurn();
        this.isProcessing = false;

        if (!this.gameState.isGameOver) {
            this.updateUI();

            if (!isPlayerTurn) {
                setTimeout(() => {
                    this.executeEnemyTurn();
                }, 500);
            }
        }
    }

    updateCharacterDisplay() {
        const alliesContainer = document.getElementById('allies-container');
        const enemiesContainer = document.getElementById('enemies-container');

        alliesContainer.innerHTML = '';
        enemiesContainer.innerHTML = '';

        // 绘制我方角色
        this.gameState.getAllies().forEach(character => {
            const characterElement = this.battleRenderer.createCharacterElement(character);

            // 为角色添加点击事件
            characterElement.addEventListener('click', () => {
                this.handleCharacterClick(character);
            });

            // 如果当前有选中的技能，高亮可用的目标
            if (this.selectedSkill) {
                if (this.isValidTarget(character, this.selectedSkill)) {
                    characterElement.classList.add('selectable-target');
                }
            }

            alliesContainer.appendChild(characterElement);
        });

        // 绘制敌方角色
        this.gameState.getEnemies().forEach(character => {
            const characterElement = this.battleRenderer.createCharacterElement(character);

            // 为角色添加点击事件
            characterElement.addEventListener('click', () => {
                this.handleCharacterClick(character);
            });

            // 如果当前有选中的技能，高亮可用的目标
            if (this.selectedSkill) {
                if (this.isValidTarget(character, this.selectedSkill)) {
                    characterElement.classList.add('selectable-target');
                }
            }

            enemiesContainer.appendChild(characterElement);
        });
    }

    handleSkillClick(skill, user) {
        if (!this.battleSystem.isSkillAvailable(skill, user) || this.isProcessing) {
            return;
        }

        console.log(`点击技能: ${skill.name}, 目标类型: ${skill.targetType}`);

        // 根据技能类型决定是否需要选择目标
        if (skill.requiresTargetSelection()) {
            console.log(`技能需要选择目标，显示可点击目标`);
            this.selectedSkill = skill;
            this.updateUI(); // 更新UI以显示可点击的目标
        } else {
            // 不需要选择目标的技能直接执行
            console.log(`技能不需要选择目标，直接执行`);
            this.executeSkill(skill, user);
        }
    }

    updateCurrentTurn() {
        const currentTurnElement = document.getElementById('current-turn');
        const turnIndicator = document.getElementById('turn-indicator');
        const currentCharacter = this.gameState.characters[this.gameState.currentTurnIndex];

        currentTurnElement.textContent = `当前行动: ${currentCharacter.name}`;

        if (this.gameState.isPlayerTurn) {
            turnIndicator.textContent = '👤 玩家回合';
            turnIndicator.className = 'turn-indicator player-turn';
        } else {
            turnIndicator.textContent = '👹 敌人回合';
            turnIndicator.className = 'turn-indicator enemy-turn';
        }
    }

    updateSkillPanel() {
        const skillsContainer = document.getElementById('skills-container');
        if (!skillsContainer) return;

        const currentCharacter = this.gameState.characters[this.gameState.currentTurnIndex];
        if (!currentCharacter) return;

        // 防御性检查：确保 skills 是数组
        const skills = Array.isArray(currentCharacter.skills) ? currentCharacter.skills : [];

        skillsContainer.innerHTML = '';

        skills.forEach(skill => {
            const skillElement = this.skillPanel.createSkillElement(skill, currentCharacter, this.battleSystem);

            skillElement.addEventListener('click', () => {
                this.handleSkillClick(skill, currentCharacter);
            });

            const targetDesc = document.createElement('div');
            targetDesc.className = 'skill-target-desc';
            targetDesc.textContent = skill.getTargetDescription ? skill.getTargetDescription() : '选择目标';
            targetDesc.style.fontSize = '0.6rem';
            targetDesc.style.color = '#b0b0ff';
            targetDesc.style.marginTop = '3px';
            skillElement.appendChild(targetDesc);

            skillsContainer.appendChild(skillElement);
        });
    }

    handleSkillClick(skill, user) {
        if (!this.battleSystem.isSkillAvailable(skill, user) || this.isProcessing) {
            return;
        }

        // 如果技能需要选择目标
        if (skill.requiresTargetSelection()) {
            console.log(`选择技能: ${skill.name}, 请点击目标`);
            this.selectedSkill = skill;
            this.updateUI(); // 更新UI以显示可点击的目标
        } else {
            // 不需要选择目标的技能直接执行
            this.executeSkill(skill, user);
        }
    }

    executeSkill(skill, user) {
        this.isProcessing = true;
        this.selectedSkill = null; // 清除选中的技能

        console.log(`直接执行技能: ${skill.name}`);
        const allSurvived = this.battleSystem.executeSkill(skill, user);

        this.gameState.checkGameEnd();
        this.updateUI();

        if (!allSurvived) {
            setTimeout(() => {
                this.continueToNextTurn();
            }, 1500);
        } else {
            this.continueToNextTurn();
        }
    }

    handleCharacterClick(character) {
        console.log('角色被点击:', character.name);

        // 如果当前没有选中的技能，或者正在处理中，忽略点击
        if (!this.selectedSkill || this.isProcessing) {
            console.log('没有选中的技能或正在处理中，忽略点击');
            return;
        }

        // 检查目标是否有效
        if (!this.isValidTarget(character, this.selectedSkill)) {
            console.log('无效的目标:', character.name);
            return;
        }

        console.log('执行技能:', this.selectedSkill.name, '目标:', character.name);
        // 执行技能
        this.executeSkillWithTarget(this.selectedSkill, character);
    }

    // 修改：执行技能（需要选择目标）
    executeSkillWithTarget(skill, target) {
        this.isProcessing = true;
        const user = this.gameState.characters[this.gameState.currentTurnIndex];

        console.log(`执行带目标的技能: ${skill.name}, 目标: ${target.name}`);
        const allSurvived = this.battleSystem.executeSkill(skill, user, target);

        this.selectedSkill = null; // 清除选中的技能
        this.gameState.checkGameEnd();
        this.updateUI();

        if (!allSurvived) {
            setTimeout(() => {
                this.continueToNextTurn();
            }, 1500);
        } else {
            this.continueToNextTurn();
        }
    }

    // 修改：检查目标是否有效
    isValidTarget(character, skill) {
        const user = this.gameState.characters[this.gameState.currentTurnIndex];

        // 检查目标是否存活
        if (character.currentHp <= 0) {
            console.log('目标已死亡，无效');
            return false;
        }

        // 根据技能目标类型检查有效性
        switch (skill.targetType) {
            case TargetType.SINGLE:
            case TargetType.SPREAD:
                if (skill.hasTag(SkillTag.ATTACK)) {
                    // 攻击技能只能选择敌人
                    const isValid = character.type === 'enemy';
                    console.log(`攻击技能目标检查: ${character.name} 是敌人? ${isValid}`);
                    return isValid;
                } else if (skill.hasTag(SkillTag.HEAL) || skill.hasTag(SkillTag.BUFF)) {
                    // 治疗和增益技能只能选择友方
                    const isValid = character.type === 'ally';
                    console.log(`治疗/增益技能目标检查: ${character.name} 是友方? ${isValid}`);
                    return isValid;
                }
                // 其他类型的技能默认允许选择
                console.log(`其他技能目标检查: ${character.name} 默认允许`);
                return true;

            default:
                console.log(`技能 ${skill.name} 不需要选择目标`);
                return false;
        }
    }

    executePlayerSkillWithTarget(skill, user, target) {
        this.isProcessing = true;

        const allSurvived = this.battleSystem.executeSkill(skill, user, target);

        this.gameState.selectedSkill = null;
        this.hideTargetSelection();
        this.gameState.checkGameEnd();
        this.updateUI();

        if (!allSurvived) {
            setTimeout(() => {
                this.continueToNextTurn();
            }, 1500);
        } else {
            this.continueToNextTurn();
        }
    }

    updateBattleLog() {
        const logEntries = document.getElementById('log-entries');
        logEntries.innerHTML = '';

        this.gameState.log.forEach(logEntry => {
            const logElement = document.createElement('div');
            logElement.className = 'log-entry';
            logElement.innerHTML = logEntry.message;
            logElement.style.color = logEntry.color;
            logEntries.appendChild(logElement);
        });

        logEntries.scrollTop = logEntries.scrollHeight;
    }

    showGameOver() {
        console.log('游戏结束');
    }
}

window.UIManager = UIManager;