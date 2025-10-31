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
        
        this.addLog = this.addLog.bind(this);
        this.nextTurn = this.nextTurn.bind(this);
        this.resetGame = this.resetGame.bind(this);
    }

    addCharacter(character) {
        character.gameState = this;
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

    nextTurn() {
        if (this.isGameOver) return;

        const currentCharacter = this.characters[this.currentTurnIndex];
        currentCharacter.isActive = false;

        currentCharacter.gainEnergy(1);

        this.handleSpecialCharacterTurnEnd(currentCharacter);

        this.characters.forEach(char => char.updateStatusEffects());

        this.moveToNextAliveCharacter();

        this.turnCount++;

        const newCharacter = this.characters[this.currentTurnIndex];
        this.isPlayerTurn = newCharacter.type === 'ally';

        this.selectedSkill = null;
        this.selectedTarget = null;

        return this.isPlayerTurn;
    }

    handleSpecialCharacterTurnEnd(character) {
        if (character.name === "钫酸" && character.isSwordActive) {
            character.currentMana -= character.maxMana * 0.1;
            character.swordTimer--;

            if (character.currentMana <= 0 || character.swordTimer <= 0) {
                character.isSwordActive = false;
                this.addLog(`${character.name}的宝剑效果结束`, 'debuff');

                this.characters.forEach(char => {
                    char.removeStatusEffect("最终伤害增加");
                    char.removeStatusEffect("免疫死亡");
                    char.removeStatusEffect("技能沉默");
                    char.removeStatusEffect("受到伤害增加");
                    if (char.name === "钫酸") {
                        char.removeStatusEffect("宝具伤害加成");
                    }
                });
            }
        }
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

            if (char.name === "钫酸") {
                char.currentMana = char.maxMana;
                char.isSwordActive = false;
                char.swordTimer = 0;
            }
        });

        if (this.characters.length > 0) {
            this.characters[0].isActive = true;
        }
    }
}

window.GameState = GameState;