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
        this.updateSpeedTrack();
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

    // 更新统一的速度条显示
    updateSpeedTrack() {
        const speedTrack = document.getElementById('speed-track');
        const speedTrackMarkers = document.getElementById('speed-track-markers');
        
        if (!speedTrack) {
            console.warn('速度条元素 speed-track 未找到');
            return;
        }
        
        if (!speedTrackMarkers) {
            console.warn('速度条标记容器 speed-track-markers 未找到');
            return;
        }

        // 获取所有存活角色
        const aliveCharacters = this.gameState.getAliveCharacters();
        
        if (aliveCharacters.length === 0) {
            speedTrackMarkers.innerHTML = '';
            console.log('没有存活的角色，速度条为空');
            return;
        }
        
        // 速度条长度为500，显示角色在0-500范围内的位置（使用模运算）
        const TRACK_LENGTH = 500;

        // 使用Map来跟踪现有标记，避免重新创建元素
        const existingMarkers = new Map();
        Array.from(speedTrackMarkers.children).forEach(marker => {
            const uuid = marker.getAttribute('data-uuid');
            if (uuid) {
                existingMarkers.set(uuid, marker);
            }
        });

        aliveCharacters.forEach(character => {
            // 确保 actionValue 存在
            if (typeof character.actionValue === 'undefined') {
                character.actionValue = 0;
            }
            
            // 计算角色在当前500段内的位置（0-100%）
            const currentSegmentValue = character.actionValue % TRACK_LENGTH;
            const position = Math.min(100, (currentSegmentValue / TRACK_LENGTH) * 100);
            
            // 计算已经完成的圈数
            const completedLaps = Math.floor(character.actionValue / TRACK_LENGTH);
            
            // 检查是否可以行动
            const canTakeAction = character.canTakeAction && character.canTakeAction();
            
            // 尝试获取现有标记，如果不存在则创建新的
            let marker = existingMarkers.get(character.uuid);
            
            if (!marker) {
                // 创建新标记
                marker = document.createElement('div');
                marker.className = `speed-track-marker ${character.type}`;
                marker.setAttribute('data-character', character.name);
                marker.setAttribute('data-uuid', character.uuid);

                // 创建角色图标
                const icon = document.createElement('div');
                icon.className = 'speed-marker-icon';
                icon.textContent = character.icon || '🚀';

                // 创建角色名称标签
                const label = document.createElement('div');
                label.className = 'speed-marker-label';
                label.textContent = character.name || '未知';

                marker.appendChild(icon);
                marker.appendChild(label);
                speedTrackMarkers.appendChild(marker);
                
                // 初始位置设置（无动画）
                marker.style.transition = 'none';
                marker.style.left = `${position}%`;
                // 强制重排以应用初始位置
                marker.offsetHeight;
                // 恢复动画
                marker.style.transition = '';
            } else {
                // 更新现有标记
                existingMarkers.delete(character.uuid);
            }
            
            // 更新标记的样式和类
            const classes = [`speed-track-marker`, character.type];
            if (character.isActive) classes.push('active');
            if (canTakeAction) classes.push('ready');
            marker.className = classes.join(' ');
            
            // 使用requestAnimationFrame确保平滑更新
            requestAnimationFrame(() => {
                marker.style.left = `${position}%`;
            });
            
            const actualSpeed = character.getActualSpeed ? character.getActualSpeed() : (character.speed || 0);
            marker.title = `${character.name}\n行动值: ${Math.floor(character.actionValue)}\n当前段: ${Math.floor(currentSegmentValue)}/500\n已完成圈数: ${completedLaps}\n速度: ${actualSpeed}`;
        });
        
        // 移除不再存在的标记（角色已死亡或离开）
        existingMarkers.forEach(marker => {
            marker.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            marker.style.opacity = '0';
            marker.style.transform = 'translateX(-50%) scale(0.8)';
            setTimeout(() => {
                if (marker.parentNode) {
                    marker.parentNode.removeChild(marker);
                }
            }, 300);
        });
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

        // 正常情况：切换到下一个回合
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

        // 正常情况：切换到下一个回合
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