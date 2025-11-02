// TriggerHelper.js - 常用事件触发器助手
class TriggerHelper {
    /**
     * 注册伤害相关事件
     */
    static registerDamageTriggers(character) {
        // 造成伤害时触发
        character.onEvent('deal_damage', (event) => {
            const { damage, target, damageType, skillType } = event.data;
            
            // 可以在这里添加各种伤害相关的效果
            console.log(`${character.name} 造成伤害: ${damage}`);
            
            // 触发特定伤害类型的事件
            character.trigger(`deal_${damageType}_damage`, {
                damage,
                target,
                skillType
            });
        });

        // 受到伤害时触发
        character.onEvent('take_damage', (event) => {
            const { damage, source, damageType } = event.data;
            
            console.log(`${character.name} 受到伤害: ${damage}`);
            
            // 触发特定伤害类型的受伤事件
            character.trigger(`take_${damageType}_damage`, {
                damage,
                source
            });
        });
    }

    /**
     * 注册回合相关事件
     */
    static registerTurnTriggers(character) {
        character.onEvent('turn_start', (event) => {
            console.log(`${character.name} 回合开始`);
        });

        character.onEvent('turn_end', (event) => {
            console.log(`${character.name} 回合结束`);
        });
    }

    /**
     * 注册状态效果相关事件
     */
    static registerStatusTriggers(character) {
        character.onEvent('status_gain', (event) => {
            const { status, source } = event.data;
            console.log(`${character.name} 获得状态: ${status.name}`);
        });

        character.onEvent('status_remove', (event) => {
            const { status } = event.data;
            console.log(`${character.name} 失去状态: ${status.name}`);
        });
    }
}

window.TriggerHelper = TriggerHelper;