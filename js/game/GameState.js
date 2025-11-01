class GameState {
    constructor() {
        this.characters = [];
        this.currentTurnIndex = 0;
        this.turnCount = 1;
        this.log = [];
        this.isGameOver = false;
        this.selectedSkill = null;
        this.selectedTarget = null;
        this.isPlayerTurn = true;
        this.actionQueue = []; // 行动队列（按优先级排序）
        this.SPEED_TRACK_LENGTH = 500; // 速度条长度
    }

    addCharacter(character) {
        character.gameState = this;  // 这里设置 gameState 引用
        this.characters.push(character);
    }

    getAllies() {
        return this.characters.filter(char => char.type === 'ally');
    }

    getEnemies() {
        return this.characters.filter(char => char.type === 'enemy');
    }

    getAliveCharacters() {
        return this.characters.filter(char => char.currentHp > 0);
    }

    // 初始化速度条系统
    initializeSpeedSystem() {
        // 初始化所有角色的行动值
        this.characters.forEach(char => {
            if (char.currentHp > 0) {
                char.actionValue = 0;
            }
        });
        
        // 构建初始行动队列（按速度排序）
        this.updateActionQueue();
        
        // 推进角色直到至少有一个角色可以行动
        let iterations = 0;
        const maxIterations = 1000;
        while (this.actionQueue.length > 0 && !this.getNextCharacter() && iterations < maxIterations) {
            this.advanceAllCharacters();
            iterations++;
        }
    }

    // 更新行动队列（按行动值排序，行动值高的在前）
    updateActionQueue() {
        const aliveCharacters = this.getAliveCharacters();
        
        // 按行动值降序排序，行动值相同则按速度降序
        this.actionQueue = aliveCharacters.slice().sort((a, b) => {
            if (b.actionValue !== a.actionValue) {
                return b.actionValue - a.actionValue;
            }
            return b.getActualSpeed() - a.getActualSpeed();
        });
        
        console.log('行动队列更新:', this.actionQueue.map(c => ({
            name: c.name,
            actionValue: c.actionValue,
            speed: c.getActualSpeed()
        })));
    }

    // 推进所有角色的行动值
    advanceAllCharacters() {
        this.characters.forEach(char => {
            if (char.currentHp > 0) {
                char.advanceActionValue();
            }
        });
        
        // 更新行动队列
        this.updateActionQueue();
    }

    // 获取下一个应该行动的角色
    getNextCharacter() {
        // 找到第一个行动值达到500的倍数的角色
        for (let char of this.actionQueue) {
            if (char.canTakeAction()) {
                return char;
            }
        }
        return null;
    }

    // 插入角色到行动队列（用于额外行动等效果）
    insertIntoActionQueue(character, actionValue = null) {
        if (actionValue === null) {
            // 如果不指定行动值，设置为当前最高行动值
            if (this.actionQueue.length > 0) {
                actionValue = this.actionQueue[0].actionValue;
            } else {
                actionValue = this.SPEED_TRACK_LENGTH;
            }
        }
        
        character.actionValue = actionValue;
        this.updateActionQueue();
    }

    nextTurn() {
        if (this.isGameOver) return false;

        // 获取当前行动角色（如果有）
        let currentCharacter = null;
        const currentIndex = this.characters.findIndex(c => c.isActive);
        if (currentIndex >= 0) {
            currentCharacter = this.characters[currentIndex];
        }

        // 如果有当前行动角色，处理回合结束
        if (currentCharacter) {
            console.log(`=== ${currentCharacter.name} 的回合结束 ===`);
            
            // 处理回合开始前效果
            this.handleTurnStartEffects(currentCharacter);
            
            // 处理回合结束后效果
            this.handleTurnEndEffects(currentCharacter);
            
            // 消耗行动值（减去500）
            currentCharacter.consumeAction();
            
            // 检查是否有额外行动
            if (currentCharacter.hasExtraAction) {
                // 清除额外行动标志
                currentCharacter.hasExtraAction = false;
                // 设置行动值为500，确保可以立即行动
                currentCharacter.actionValue = 500;
                // 保持角色活跃状态
                currentCharacter.isActive = true;
                // 不推进角色，直接返回当前角色
                console.log(`=== ${currentCharacter.name} 获得额外行动，继续行动 ===`);
                return currentCharacter.type === 'ally';
            }
            
            // 标记角色非活跃
            currentCharacter.isActive = false;
        }

        // 推进所有角色的行动值
        this.advanceAllCharacters();

        // 获取下一个应该行动的角色
        let nextCharacter = this.getNextCharacter();
        
        // 如果没有角色达到行动值，继续推进直到有人达到
        let iterations = 0;
        const maxIterations = 1000; // 防止无限循环
        while (!nextCharacter && iterations < maxIterations) {
            this.advanceAllCharacters();
            nextCharacter = this.getNextCharacter();
            iterations++;
        }

        if (!nextCharacter) {
            console.error('无法找到下一个行动角色');
            return false;
        }

        // 找到下一个角色的索引
        const nextIndex = this.characters.findIndex(c => c === nextCharacter);
        if (nextIndex < 0) {
            console.error('无法找到角色索引');
            return false;
        }

        this.currentTurnIndex = nextIndex;
        this.turnCount++;
        this.isPlayerTurn = nextCharacter.type === 'ally';

        // 重置选择
        this.selectedSkill = null;
        this.selectedTarget = null;

        console.log(`=== ${nextCharacter.name} 的回合开始 (行动值: ${nextCharacter.actionValue.toFixed(1)}, 速度: ${nextCharacter.getActualSpeed()}) ===`);

        // 处理新回合开始
        this.handleNewTurnStart(nextCharacter);

        return this.isPlayerTurn;
    }

    handleTurnStartEffects(character) {
        // 只处理 triggerTime === 'start' 的效果
        this.processStatusEffects(character, 'start');
    }

    handleTurnEndEffects(character) {
        // 只处理 triggerTime === 'end' 的效果  
        this.processStatusEffects(character, 'end');
    }

    // 统一的状态效果处理方法
    processStatusEffects(character, triggerTime) {
        const effectsToRemove = [];

        character.statusEffects.forEach(effect => {
            if (effect.triggerTime === triggerTime) {
                console.log(`处理 ${character.name} 的 ${effect.name} (${triggerTime})`);

                // 检查是否需要减少持续时间
                if (effect.shouldDecrease(character, this.currentTurnIndex, this)) {
                    const oldDuration = effect.duration;
                    effect.duration -= 1;
                    console.log(`  ${effect.name} 持续时间: ${oldDuration} -> ${effect.duration}`);
                }

                // 检查是否需要移除
                if (effect.duration <= 0) {
                    effectsToRemove.push(effect);
                    console.log(`  ${effect.name} 效果结束`);
                }
            }
        });

        // 移除过期效果
        character.statusEffects = character.statusEffects.filter(effect =>
            !effectsToRemove.includes(effect)
        );

        // 通知效果移除
        effectsToRemove.forEach(effect => {
            this.addLog(`${character.name}的【${effect.name}】效果结束了`, 'debuff');
        });
        
        // 处理持续治疗效果（回合结束时）
        if (triggerTime === 'end') {
            character.statusEffects.forEach(effect => {
                // 骑士之道治疗效果
                if (effect.name === "骑士之道的庇护" && effect.attackBonus) {
                    const knightCount = effect.attackBonus; // 使用attackBonus存储骑士数量
                    const healAmount = Math.floor(character.maxHp * 0.04 * knightCount);
                    const oldHp = character.currentHp;
                    character.currentHp = Math.min(character.maxHp, character.currentHp + healAmount);
                    if (character.currentHp > oldHp) {
                        this.addLog(`${character.name} 受到骑士之道治疗 ${healAmount} 点生命`, 'heal');
                    }
                }
            });
        }
    }

    // 新增方法：处理新回合开始
    handleNewTurnStart(newCharacter) {
        newCharacter.isActive = true;

        // 处理回合开始时的特殊效果（如眩晕）
        newCharacter.statusEffects.forEach(effect => {
            if (effect.triggerTime === 'start' && effect.isStunned) {
                if (newCharacter.canBeStunned && newCharacter.canBeStunned()) {
                    this.addLog(`${newCharacter.name}被眩晕，无法行动`, 'debuff');
                }
            }
        });
    }


    moveToNextAliveCharacter() {
        const aliveCharacters = this.getAliveCharacters();
        if (aliveCharacters.length === 0) return;

        const currentIndex = this.currentTurnIndex;
        while (true) {
            this.currentTurnIndex = (this.currentTurnIndex + 1) % this.characters.length;
            if (this.characters[this.currentTurnIndex].currentHp > 0) break;
            if (this.currentTurnIndex === currentIndex) break;
        }

        this.characters[this.currentTurnIndex].isActive = true;
    }

    checkGameEnd() {
        const alliesAlive = this.getAllies().filter(char => char.currentHp > 0).length;
        const enemiesAlive = this.getEnemies().filter(char => char.currentHp > 0).length;

        if (alliesAlive === 0) {
            this.addLog("战斗失败！我方队伍被击败了", 'damage');
            this.isGameOver = true;
        } else if (enemiesAlive === 0) {
            this.addLog("战斗胜利！敌方队伍被击败了", 'heal');
            this.isGameOver = true;
        }
    }

    addLog(message, type = 'normal') {
        const colors = {
            normal: '#e0e0ff',
            damage: '#ff4d7a',
            heal: '#00ff88',
            Point: '#ffd166',
            buff: '#a78bfa',
            debuff: '#ff8e53'
        };

        this.log.push({ message, color: colors[type] });
        if (this.log.length > 10) {
            this.log.shift();
        }
    }

    resetGame() {
        this.isGameOver = false;
        this.currentTurnIndex = 0;
        this.turnCount = 1;
        this.log = [{ message: "战斗开始！", color: '#e0e0ff' }];
        this.selectedSkill = null;
        this.selectedTarget = null;
        this.isPlayerTurn = true;

        this.characters.forEach(char => {
            char.currentHp = char.maxHp;
            char.currentPoint = 0;
            char.statusEffects = [];
            char.isActive = false;
            char.actionValue = 0; // 重置行动值
        });

        // 初始化速度条系统
        this.initializeSpeedSystem();
        
        // 设置第一个行动的角色
        let firstCharacter = this.getNextCharacter();
        if (firstCharacter) {
            const firstIndex = this.characters.findIndex(c => c === firstCharacter);
            if (firstIndex >= 0) {
                this.currentTurnIndex = firstIndex;
                this.isPlayerTurn = firstCharacter.type === 'ally';
                firstCharacter.isActive = true;
            }
        } else if (this.characters.length > 0) {
            // 如果没有角色达到行动值，推进直到有人达到
            let iterations = 0;
            while (!firstCharacter && iterations < 100) {
                this.advanceAllCharacters();
                firstCharacter = this.getNextCharacter();
                if (firstCharacter) {
                    const idx = this.characters.findIndex(c => c === firstCharacter);
                    if (idx >= 0) {
                        this.currentTurnIndex = idx;
                        this.isPlayerTurn = firstCharacter.type === 'ally';
                        firstCharacter.isActive = true;
                        break;
                    }
                }
                iterations++;
            }
        }
    }
}

window.GameState = GameState;