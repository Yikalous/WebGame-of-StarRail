// 主程序入口
document.addEventListener('DOMContentLoaded', function() {
    console.log('游戏初始化开始...');
    
    try {
        const gameState = new GameState();
        const skillExecutor = new SkillExecutor();
        const battleSystem = new BattleSystem(gameState);
        const characterLoader = new CharacterLoader(skillExecutor);
        
        const characters = characterLoader.loadDefaultCharacters();
        characters.forEach(character => gameState.addCharacter(character));
        
        const uiManager = new UIManager(gameState, battleSystem);
        
        uiManager.updateUI();
        
        console.log('崩坏：星穹铁道游戏初始化完成！');
        console.log('角色列表:', characters.map(c => c.name));
        
        window.game = {
            gameState,
            battleSystem,
            characterLoader,
            uiManager
        };
        
    } catch (error) {
        console.error('游戏初始化失败:', error);
    }
});