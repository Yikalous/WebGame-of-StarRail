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
        // 重置逾柿的"眼的回想"本回合触发标志
        if (character.passiveSkills && character.passiveSkills.eyeRecall) {
            character.passiveSkills.eyeRecall.triggeredThisTurn = false;
        }
        
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
                
                // 该隐印记：回合结束时减少一层
                if (effect.name === "该隐印记" && effect.value) {
                    effect.value = Math.max(0, effect.value - 1);
                    if (effect.value <= 0) {
                        // 移除该隐印记和相关的攻击加成
                        character.statusEffects = character.statusEffects.filter(e => 
                            e.name !== "该隐印记" && e.name !== "该隐印记-攻击"
                        );
                        this.addLog(`${character.name} 的该隐印记消失了`, 'debuff');
                    } else {
                        // 更新攻击力加成
                        const attackEffect = character.statusEffects.find(e => e.name === "该隐印记-攻击");
                        if (attackEffect) {
                            attackEffect.attackPercent = 0.3 * effect.value;
                        }
                        this.addLog(`${character.name} 的该隐印记减少至 ${effect.value} 层`, 'debuff');
                    }
                }
                
                // 火翼的护盾处理（如果需要）
                if (effect.name === "火翼的护盾" && effect.value) {
                    // 护盾在受到伤害时减少，这里可以添加相关逻辑
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
        
        // 处理"下回合给予该隐印记"效果（必须在processStatusEffects之前，否则duration减少后可能被移除）
        const markEffect = newCharacter.statusEffects.find(e => e.name === "下回合给予该隐印记");
        if (markEffect) {
            console.log(`处理 ${newCharacter.name} 的"下回合给予该隐印记"，value=${markEffect.value}`);
            this.grantCainMark(newCharacter, markEffect.value || 2);
            // 移除标记效果
            newCharacter.statusEffects = newCharacter.statusEffects.filter(e => e !== markEffect);
        } else {
            // 调试：检查是否有类似的状态效果
            const similarEffects = newCharacter.statusEffects.filter(e => e.name && e.name.includes('该隐'));
            if (similarEffects.length > 0) {
                console.log(`${newCharacter.name} 有相关状态效果:`, similarEffects.map(e => e.name));
            }
        }

        // 处理回合开始时的状态效果（包括减少duration和移除过期效果）
        this.handleTurnStartEffects(newCharacter);
        
        // 处理额外行动次数
        if (newCharacter.extraActionCount && newCharacter.extraActionCount > 0) {
            newCharacter.hasExtraAction = true;
            newCharacter.extraActionCount--;
            this.addLog(`${newCharacter.name} 获得额外行动机会（剩余 ${newCharacter.extraActionCount} 次）`, 'buff');
        }
        
        // 处理逾柿的亡语效果（每回合开始时）
        const deadYushi = this.characters.find(c => c.name === "逾柿" && c.deathRattleActive);
        if (deadYushi && deadYushi.passiveSkills && deadYushi.passiveSkills.deathRattle) {
            if (deadYushi.passiveSkills.deathRattle.onTurnStart) {
                deadYushi.passiveSkills.deathRattle.onTurnStart(deadYushi, this.characters, this);
            }
        }
    }
    
    // 给予该隐印记
    grantCainMark(yushi, count) {
        const allies = this.characters.filter(c => c.type === 'ally' && c.currentHp > 0 && c !== yushi);
        
        // 优先选择钫酸
        const fangsuan = allies.find(c => c.name === "钫酸");
        const recipients = [];
        
        if (fangsuan) {
            recipients.push(fangsuan);
        }
        
        // 添加其他盟友，直到达到指定数量
        for (let ally of allies) {
            if (recipients.length >= count) break;
            if (ally !== fangsuan) {
                recipients.push(ally);
            }
        }
        
        // 给自身和选中的队友添加该隐印记
        [yushi, ...recipients].forEach(char => {
            // 查找或创建该隐印记
            let cainMark = char.statusEffects.find(e => e.name === "该隐印记");
            if (!cainMark) {
                cainMark = new StatusEffect("该隐印记", 999);
                cainMark.turnType = 'self';
                cainMark.triggerTime = 'end';
                cainMark.owner = char;
                cainMark.value = 0; // 存储层数
                cainMark.appliedTurn = this.turnCount || 0;
                char.statusEffects.push(cainMark);
            }
            
            // 增加层数
            cainMark.value = (cainMark.value || 0) + 1;
            
            // 更新攻击力加成（根据层数）
            let attackEffect = char.statusEffects.find(e => e.name === "该隐印记-攻击");
            if (!attackEffect) {
                char.addStatusEffect("该隐印记-攻击", "attackPercent", 0.3 * cainMark.value, 999, 'self', 'end');
            } else {
                attackEffect.attackPercent = 0.3 * cainMark.value;
            }
            
            this.addLog(`${char.name} 获得该隐印记（层数：${cainMark.value}，攻击力+${(0.3 * cainMark.value * 100).toFixed(0)}%）`, 'buff');
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