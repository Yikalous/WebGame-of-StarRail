class BattleRenderer {
    createCharacterElement(character) {
        const characterElement = document.createElement('div');
        characterElement.className = `character ${character.type} ${character.isActive ? 'active' : ''}`;

        const hpPercent = (character.currentHp / character.maxHp) * 100;
        const PointPercent = (character.currentPoint / character.maxPoint) * 100;

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

        const canAct = character.canAct();
        const actionStatus = canAct ? '' : '<div class="action-status cannot-act">无法行动</div>';

        characterElement.innerHTML = `
            <div class="character-icon">${character.icon}</div>
            <div class="character-name">${character.name}</div>
            ${actionStatus}
            <div class="hp-bar">
                <div class="hp-fill" style="width: ${hpPercent}%"></div>
            </div>
            <div class="Point-bar">
                <div class="Point-fill" style="width: ${PointPercent}%"></div>
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

    // BattleRenderer.js - 完善状态效果显示
    getStatusEffectText(effect) {
        const parts = [];

        // 基础属性
        if (effect.attackPercent !== 0) parts.push(`攻击${effect.attackPercent > 0 ? '+' : ''}${(effect.attackPercent * 100)}%`);
        if (effect.defensePercent !== 0) parts.push(`防御${effect.defensePercent > 0 ? '+' : ''}${(effect.defensePercent * 100)}%`);

        // 伤害加成
        if (effect.damageBonus !== 0) parts.push(`全属性伤害${effect.damageBonus > 0 ? '+' : ''}${(effect.damageBonus * 100)}%`);
        if (effect.basicAttackBonus !== 0) parts.push(`普攻伤害+${(effect.basicAttackBonus * 100)}%`);
        if (effect.skillBonus !== 0) parts.push(`战技伤害+${(effect.skillBonus * 100)}%`);
        if (effect.ultimateBonus !== 0) parts.push(`终结技伤害+${(effect.ultimateBonus * 100)}%`);
        if (effect.followUpBonus !== 0) parts.push(`追击伤害+${(effect.followUpBonus * 100)}%`);
        if (effect.fireBonus !== 0) parts.push(`火属性伤害+${(effect.fireBonus * 100)}%`);
        if (effect.iceBonus !== 0) parts.push(`冰属性伤害+${(effect.iceBonus * 100)}%`);
        if (effect.lightningBonus !== 0) parts.push(`雷属性伤害+${(effect.thunderBonus * 100)}%`);
        if (effect.windBonus !== 0) parts.push(`风属性伤害+${(effect.windBonus * 100)}%`);
        if (effect.physicalBonus !== 0) parts.push(`物属性伤害+${(effect.physicalBonus * 100)}%`);
        if (effect.quantumBonus !== 0) parts.push(`量子属性伤害+${(effect.quantumBonus * 100)}%`);
        if (effect.imaginaryBonus !== 0) parts.push(`虚数属性伤害+${(effect.imaginaryBonus * 100)}%`);

        // 易伤和抗性
        if (effect.damageTakenBonus !== 0) parts.push(`受到伤害+${(effect.damageTakenBonus * 100)}%`);
        if (effect.vulnerability !== 0) parts.push(`易伤+${(effect.vulnerability * 100)}%`);
        if (effect.defenseIgnore !== 0) parts.push(`无视防御+${(effect.defenseIgnore * 100)}%`);

        // 特殊状态
        if (effect.isSilenced) parts.push('沉默');
        if (effect.isStunned) parts.push('眩晕');
        if (effect.isImmuneDeath) parts.push('免死');
        if (effect.isFrozen) parts.push('冻结');
        if (effect.isBurned) parts.push('燃烧');
        if (effect.isShocked) parts.push('感电');

        return parts.join(' ');
    }
}

window.BattleRenderer = BattleRenderer;