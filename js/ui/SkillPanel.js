class SkillPanel {
    createSkillElement(skill, character, battleSystem) {
        const skillElement = document.createElement('div');
        const isAvailable = battleSystem.isSkillAvailable(skill, character);
        
        skillElement.className = `skill ${isAvailable ? '' : 'disabled'}`;
        skillElement.dataset.skillType = skill.skillType;
        
        const tags = Array.isArray(skill.tags) ? skill.tags : [];
        
        const tagsHTML = tags.map(tag => 
            `<span class="skill-tag" style="background-color: ${skill.getTagColor(tag)}">${this.getTagText(tag)}</span>`
        ).join('');
        
        const damageTypeHTML = tags.includes(SkillTag.ATTACK) ? 
            `<div class="damage-type" style="color: ${skill.getDamageTypeColor()}">${this.getDamageTypeText(skill.damageType)}伤害</div>` : '';

        skillElement.innerHTML = `
            <div class="skill-icon">${skill.icon}</div>
            <div class="skill-name">${skill.name}</div>
            <div class="skill-desc">${skill.description}</div>
            ${damageTypeHTML}
            <div class="skill-tags">${tagsHTML}</div>
            <div class="skill-desc">能量消耗: ${skill.energyCost}</div>
        `;
        
        return skillElement;
    }
    
    createTargetElement(character) {
        const targetElement = document.createElement('div');
        targetElement.className = 'target';
        
        const hpPercent = (character.currentHp / character.maxHp) * 100;
        
        const resistancesHTML = this.createResistancesHTML(character);
        
        targetElement.innerHTML = `
            <div class="character-icon">${character.icon}</div>
            <div class="character-name">${character.name}</div>
            <div class="hp-bar">
                <div class="hp-fill" style="width: ${hpPercent}%"></div>
            </div>
            <div class="character-stats">HP: ${character.currentHp}/${character.maxHp}</div>
            ${resistancesHTML}
        `;
        
        return targetElement;
    }

    createResistancesHTML(character) {
        const notableResistances = Object.entries(character.damageResistances)
            .filter(([type, value]) => Math.abs(value) >= 0.1)
            .map(([type, value]) => {
                const color = value > 0 ? '#a78bfa' : value < 0 ? '#ff8e53' : '#b0b0ff';
                const sign = value > 0 ? '+' : '';
                const text = value > 0 ? '抗性' : '弱点';
                return `<span class="resistance-tag" style="color: ${color}">${this.getDamageTypeText(type)}${sign}${Math.round(value * 100)}%</span>`;
            })
            .join('');
        
        return notableResistances ? `<div class="resistances">${notableResistances}</div>` : '';
    }

    getTagText(tag) {
        const texts = {
            [SkillTag.ATTACK]: '攻击',
            [SkillTag.HEAL]: '治疗',
            [SkillTag.BUFF]: '增益',
            [SkillTag.DEBUFF]: '减益',
            [SkillTag.CONTROL]: '控制',
            [SkillTag.SUMMON]: '召唤',
            [SkillTag.FIELD]: '领域',
            [SkillTag.COUNTER]: '反击',
            [SkillTag.FOLLOW_UP]: '追击',
            [SkillTag.BREAK]: '破盾',
            [SkillTag.AOE]: '范围',
            [SkillTag.SINGLE_TARGET]: '单体'
        };
        return texts[tag] || tag;
    }

    getDamageTypeText(damageType) {
        const texts = {
            [DamageType.PHYSICAL]: '物理',
            [DamageType.FIRE]: '火',
            [DamageType.ICE]: '冰',
            [DamageType.LIGHTNING]: '雷',
            [DamageType.QUANTUM]: '量子',
            [DamageType.IMAGINARY]: '虚数',
            [DamageType.WIND]: '风',
            [DamageType.PURE]: '纯粹'
        };
        return texts[damageType] || '';
    }
}

window.SkillPanel = SkillPanel;