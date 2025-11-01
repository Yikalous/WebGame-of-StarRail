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

    // 修复 nextTurn 方法
    nextTurn() {
        if (this.isGameOver) return;

        const currentCharacter = this.characters[this.currentTurnIndex];

        console.log(`=== ${currentCharacter.name} 的回合结束 ===`);

        // 1. 处理回合开始前效果（如果有的话）
        this.handleTurnStartEffects(currentCharacter);

        // 2. 标记角色非活跃
        currentCharacter.isActive = false;

        // 4. 处理回合结束后效果
        this.handleTurnEndEffects(currentCharacter);

        // 5. 移动到下一个角色
        this.moveToNextAliveCharacter();

        this.turnCount++;

        const newCharacter = this.characters[this.currentTurnIndex];
        this.isPlayerTurn = newCharacter.type === 'ally';

        // 6. 重置选择
        this.selectedSkill = null;
        this.selectedTarget = null;

        console.log(`=== ${newCharacter.name} 的回合开始 ===`);

        // 7. 处理新回合开始
        this.handleNewTurnStart(newCharacter);

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
            energy: '#ffd166',
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
            char.currentEnergy = 0;
            char.statusEffects = [];
            char.isActive = false;
        });

        if (this.characters.length > 0) {
            this.characters[0].isActive = true;
        }
    }
}

window.GameState = GameState;