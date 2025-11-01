class SkillExecutor {
    execute(skill, user, target, allCharacters) {
        if (!skill || !skill.executeFunc) {
            user.Log(`${user.name}的技能 ${skill?.name || "未知"} 没有定义执行函数`, 'debuff');
            return false;
        }

        try {
            return skill.executeFunc(user, target, allCharacters);
        } catch (err) {
            console.error("技能执行错误：", err);
            user.Log(`${user.name}的技能执行失败 (${err.message})`, 'debuff');
            return false;
        }
    }
}

window.SkillExecutor = SkillExecutor;