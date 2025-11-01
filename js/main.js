// 主程序入口
document.addEventListener('DOMContentLoaded', function () {
    console.log('游戏初始化开始...');

    try {
        // 基础系统初始化
        const gameState = new GameState();
        const skillExecutor = new SkillExecutor();
        const battleSystem = new BattleSystem(gameState);
        const characterLoader = new CharacterLoader(skillExecutor);

        // 注册所有角色模板（但不创建实例）
        window.registerAllCharacters(characterLoader);

        // 初始化选人界面
        const characterSelector = new CharacterSelector(characterLoader);
        characterSelector.init();

        // 监听角色选择完成事件
        window.addEventListener('charactersSelected', function(event) {
            const selectedCharacters = event.detail.characters;
            
            console.log('已选择角色:', selectedCharacters.map(c => c.name));
            
            // 隐藏选人界面，显示战斗界面
            const selector = document.getElementById('character-selector');
            const container = document.querySelector('.container');
            const gameArea = container.querySelector('.game-area');
            const battleLog = container.querySelector('.battle-log');
            
            if (selector) selector.style.display = 'none';
            if (gameArea) gameArea.style.display = '';
            if (battleLog) battleLog.style.display = '';
            
            document.body.classList.remove('selecting');
            
            // 添加选中的友方角色
            selectedCharacters.forEach(character => {
                if (character) gameState.addCharacter(character);
            });
            
            // 添加敌方角色（固定3个正物质军团）
            for (let i = 0; i < 3; i++) {
                const enemy = characterLoader.createCharacter("AntimatterLegion");
                if (enemy) gameState.addCharacter(enemy);
            }

            // 确保DOM元素存在后再初始化UI系统
            // 延迟一小段时间，确保DOM已更新
            setTimeout(() => {
                // 初始化速度条系统
                gameState.initializeSpeedSystem();
                
                // 初始化UI系统
                const uiManager = new UIManager(gameState, battleSystem);
                uiManager.updateUI();
                
                // 输出信息
                console.log('崩坏：星穹铁道游戏初始化完成！');
                console.log('友方角色:', selectedCharacters.map(c => c.name));
                console.log('敌方角色:', gameState.getEnemies().map(c => c.name));

                // 暴露全局
                window.game = {
                    gameState,
                    battleSystem,
                    characterLoader,
                    uiManager,
                    characters: gameState.characters
                };
            }, 50);
        });

        // 设置初始状态为选人模式
        document.body.classList.add('selecting');

        // 暴露选人界面（用于调试）
        window.characterSelector = characterSelector;

    } catch (error) {
        console.error('游戏初始化失败:', error);
    }
});
