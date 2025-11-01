// index.js - 自动注册所有角色并生成角色实例
(function() {
    console.log("开始自动注册角色...");

    // 检查 CharacterLoader 是否加载
    if (!window.CharacterLoader) {
        console.error("CharacterLoader 未定义，请确保 CharacterLoader.js 在此文件之前加载。");
        return;
    }

    /**
     * 注册并创建所有角色
     * @param {CharacterLoader} loader
     * @returns {Character[]} 已创建角色数组
     */
    window.registerAllCharacters = function(loader) {
        const characters = [];

        // 检查各角色注册函数是否存在
        const maybeRegister = (fnName, count = 1) => {
            const fn = window[fnName];
            if (typeof fn === "function") {
                for (let i = 0; i < count; i++) {
                    const char = fn(loader);
                    if (char) characters.push(char);
                }
            } else {
                console.warn(`⚠️ 未找到 ${fnName}()，请确认角色文件是否正确加载。`);
            }
        };

        // === 我方角色 ===
        maybeRegister("registerFangsuan");

        // === 敌方角色（重复3次） ===
        maybeRegister("registerAntimatterLegion", 3);

        console.log(`✅ 已注册 ${characters.length} 个角色:`, characters.map(c => c.name));
        return characters;
    };

})();
