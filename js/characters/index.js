// index.js - 自动注册所有角色并生成角色实例
(function() {
    console.log("开始自动注册角色...");

    // 检查 CharacterLoader 是否加载
    if (!window.CharacterLoader) {
        console.error("CharacterLoader 未定义，请确保 CharacterLoader.js 在此文件之前加载。");
        return;
    }

    /**
     * 注册所有角色模板（不创建实例）
     * @param {CharacterLoader} loader
     * @returns {void}
     */
    window.registerAllCharacters = function(loader) {
        // 检查各角色注册函数是否存在并注册模板
        const maybeRegisterTemplate = (fnName) => {
            const fn = window[fnName];
            if (typeof fn === "function") {
                // 调用注册函数，这会注册模板到loader中
                fn(loader);
            } else {
                console.warn(`⚠️ 未找到 ${fnName}()，请确认角色文件是否正确加载。`);
            }
        };

        // === 我方角色 ===
        // 只注册模板，不创建实例，角色在选人界面中选择
        maybeRegisterTemplate("registerFangsuan");
        maybeRegisterTemplate("registerHuangmi");
        maybeRegisterTemplate("registerYushi");

        // === 敌方角色 ===
        // 敌方角色模板也需要注册（但不在选人界面中显示）
        maybeRegisterTemplate("registerAntimatterLegion");

        console.log(`✅ 已注册角色模板:`, Object.keys(loader.characterTemplates));
    };

})();
