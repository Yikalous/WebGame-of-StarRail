// 主程序入口
document.addEventListener('DOMContentLoaded', function() {
    console.log('游戏初始化开始...');
    
    try {
        // 基础系统初始化
        const gameState = new GameState();
        const skillExecutor = new SkillExecutor();
        const battleSystem = new BattleSystem(gameState);
        const characterLoader = new CharacterLoader(skillExecutor);

        // 注册角色模板并创建角色实例
        const characters = [];

        // 🧙 盟友角色
        const fangsuan = registerFangsuan(characterLoader);
        const trailblazer = registerTrailblazer(characterLoader);
        const silverWolf = registerSilverWolf(characterLoader);

        characters.push(fangsuan, trailblazer, silverWolf);

        // 👾 敌方角色
        const enemy1 = registerAntimatterLegion(characterLoader);
        const enemy2 = registerAntimatterLegion(characterLoader);
        const enemy3 = registerAntimatterLegion(characterLoader);

        characters.push(enemy1, enemy2, enemy3);

        // 加入游戏状态
        characters.forEach(character => {
            if (character) gameState.addCharacter(character);
        });

        // 初始化UI系统
        const uiManager = new UIManager(gameState, battleSystem);
        uiManager.updateUI();

        // 输出信息
        console.log('崩坏：星穹铁道游戏初始化完成！');
        console.log('角色列表:', characters.map(c => c.name));

        // 暴露全局
        window.game = {
            gameState,
            battleSystem,
            characterLoader,
            uiManager,
            characters
        };

    } catch (error) {
        console.error('游戏初始化失败:', error);
    }
});
