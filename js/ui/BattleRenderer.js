class BattleRenderer {
    createCharacterElement(character) {
        const characterElement = document.createElement('div');
        characterElement.className = `character ${character.type} ${character.isActive ? 'active' : ''}`;
        
        const hpPercent = (character.currentHp / character.maxHp) * 100;
        const energyPercent = (character.currentEnergy / character.maxEnergy) * 100;
        
        let statusEffectsHTML = '';
        if (character.statusEffects.length > 0) {
            statusEffectsHTML = '<div class="status-effects">';
            character.statusEffects.forEach(effect => {
                const effectClass = this.getStatusEffectClass(effect);
                const effectText = this.getStatusEffectText(effect);
                statusEffectsHTML += `<div class="status-effect ${effectClass}" title="${effectText}">${effect.name}(${effect.duration})</div>`;
            });
            statusEffectsHTML += '</div>';
        }
        
        let manaHTML = '';
        if (character.name === "钫酸") {
            const manaPercent = (character.currentMana / character.maxMana) * 100;
            manaHTML = `
                <div class="energy-bar">
                    <div class="energy-fill" style="width: ${manaPercent}%"></div>
                </div>
                <div class="character-stats">魔力: ${character.currentMana}/${character.maxMana}</div>
            `;
        }

        const canAct = character.canAct();
        const actionStatus = canAct ? '' : '<div class="action-status cannot-act">无法行动</div>';
        
        characterElement.innerHTML = `
            <div class="character-icon">${character.icon}</div>
            <div class="character-name">${character.name}</div>
            ${actionStatus}
            <div class="hp-bar">
                <div class="hp-fill" style="width: ${hpPercent}%"></div>
            </div>
            <div class="energy-bar">
                <div class="energy-fill" style="width: ${energyPercent}%"></div>
            </div>
            ${manaHTML}
            <div class="character-stats">HP: ${character.currentHp}/${character.maxHp}</div>
            ${statusEffectsHTML}
        `;
        
        return characterElement;
    }

    getStatusEffectClass(effect) {
        if (effect.damageBonus > 0 || effect.basicAttackBonus > 0 || effect.skillBonus > 0 || 
            effect.ultimateBonus > 0 || effect.followUpBonus > 0) {
            return 'buff-effect';
        } else if (effect.damageTakenBonus > 0 || effect.isSilenced || effect.isStunned) {
            return 'debuff-effect';
        }
        return 'buff-effect';
    }

    getStatusEffectText(effect) {
        const parts = [];
        if (effect.damageBonus > 0) parts.push(`全伤害+${(effect.damageBonus * 100)}%`);
        if (effect.basicAttackBonus > 0) parts.push(`普攻+${(effect.basicAttackBonus * 100)}%`);
        if (effect.skillBonus > 0) parts.push(`战技+${(effect.skillBonus * 100)}%`);
        if (effect.ultimateBonus > 0) parts.push(`宝具+${(effect.ultimateBonus * 100)}%`);
        if (effect.followUpBonus > 0) parts.push(`追加+${(effect.followUpBonus * 100)}%`);
        if (effect.damageTakenBonus > 0) parts.push(`受伤+${(effect.damageTakenBonus * 100)}%`);
        if (effect.isSilenced) parts.push('沉默');
        if (effect.isStunned) parts.push('眩晕');
        if (effect.isImmuneDeath) parts.push('免死');
        
        return parts.join(', ');
    }
}

window.BattleRenderer = BattleRenderer;