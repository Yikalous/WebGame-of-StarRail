// CharacterSelector.js - 角色选择界面
class CharacterSelector {
    constructor(characterLoader) {
        this.characterLoader = characterLoader;
        this.availableCharacters = []; // 可用角色列表
        this.selectedCharacters = []; // 已选择角色（最多4个）
        this.characterTemplates = {}; // 角色模板映射
        this.eventsBound = false; // 标记事件是否已绑定
    }

    // 初始化可用角色列表
    init() {
        // 获取所有已注册的角色模板
        this.characterTemplates = this.characterLoader.characterTemplates;

        // 筛选出友方角色
        this.availableCharacters = Object.keys(this.characterTemplates)
            .filter(name => {
                const template = this.characterTemplates[name];
                return template && template.type === 'ally';
            })
            .map(name => ({
                name: name,
                template: this.characterTemplates[name],
                displayName: this.characterTemplates[name].name
            }));

        console.log('可用角色:', this.availableCharacters.map(c => c.displayName));
        this.render();
    }

    // 渲染选人界面
    render() {
        const container = document.querySelector('.container');

        // 隐藏战斗界面
        const gameArea = container.querySelector('.game-area');
        const battleLog = container.querySelector('.battle-log');
        if (gameArea) gameArea.style.display = 'none';
        if (battleLog) battleLog.style.display = 'none';

        // 检查是否已存在选人界面
        let selector = document.getElementById('character-selector');

        if (!selector) {
            // 创建选人界面
            const selectorHTML = `
                <div id="character-selector" class="character-selector">
                    <div class="selector-header">
                        <h1>选择出战角色</h1>
                        <p class="selector-subtitle">选择1-4名角色出战（已选择：<span id="selected-count">0</span>/4）</p>
                    </div>
                    
                    <div class="character-grid" id="character-grid">
                        <!-- 角色卡片将在这里生成 -->
                    </div>
                    
                    <div class="selected-characters" id="selected-characters">
                        <h3>已选择角色</h3>
                        <div class="selected-list" id="selected-list">
                            <!-- 已选择角色将显示在这里 -->
                        </div>
                    </div>
                    
                    <div class="selector-actions">
                        <button id="start-battle-btn" class="start-battle-btn" disabled>开始战斗</button>
                    </div>
                </div>
            `;

            // 在header之后插入选人界面
            const header = container.querySelector('header');
            if (header && header.nextSibling) {
                header.insertAdjacentHTML('afterend', selectorHTML);
            } else {
                container.insertAdjacentHTML('beforeend', selectorHTML);
            }

            selector = document.getElementById('character-selector');
        }

        // 显示选人界面
        if (selector) {
            selector.style.display = 'block';
        }

        // 重置事件绑定标志（因为DOM可能已重新创建）
        this.eventsBound = false;

        // 在容器级别绑定事件（事件委托，只需绑定一次）
        this.setupEventDelegation();

        // 渲染角色卡片
        this.renderCharacterCards();
        this.renderSelectedList();
    }

    // 渲染角色卡片
    renderCharacterCards() {
        const grid = document.getElementById('character-grid');
        if (!grid) {
            console.warn('character-grid元素未找到');
            return;
        }
        grid.innerHTML = '';

        this.availableCharacters.forEach(charInfo => {
            const isSelected = this.selectedCharacters.some(c => c.name === charInfo.name);
            const template = charInfo.template;

            const iconHTML = template.image
                ? `<img src="${template.image}" alt="${template.name}" class="card-icon-img">`
                : (template.icon || '🚀');

            const cardHTML = `
                <div class="character-card ${isSelected ? 'selected' : ''}" data-character-name="${charInfo.name}">
                    <div class="card-icon">${iconHTML}</div>
                    <div class="card-name">${template.name}</div>
                    <div class="card-stats">
                        <div class="stat-item">HP: ${template.maxHp || 0}</div>
                        <div class="stat-item">攻击: ${template.attack || 0}</div>
                        <div class="stat-item">速度: ${template.speed || 0}</div>
                    </div>
                    ${isSelected ? '<div class="selected-badge">已选择</div>' : ''}
                </div>
            `;


            grid.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    // 渲染已选择列表
    renderSelectedList() {
        const selectedList = document.getElementById('selected-list');
        const selectedCount = document.getElementById('selected-count');
        const startBtn = document.getElementById('start-battle-btn');

        selectedCount.textContent = this.selectedCharacters.length;
        selectedList.innerHTML = '';

        if (this.selectedCharacters.length === 0) {
            selectedList.innerHTML = '<div class="empty-selection">未选择角色</div>';
            startBtn.disabled = true;
        } else {
            this.selectedCharacters.forEach((charInfo, index) => {
                const template = charInfo.template;
                const iconHTML = template.image
                    ? `<img src="${template.image}" alt="${template.name}" class="selected-icon-img">`
                    : (template.icon || '🚀');

                const itemHTML = `
        <div class="selected-item" data-index="${index}">
            <span class="selected-icon">${iconHTML}</span>
            <span class="selected-name">${template.name}</span>
            <button class="remove-btn" data-index="${index}">×</button>
        </div>
    `;
                selectedList.insertAdjacentHTML('beforeend', itemHTML);
            });

            // 更新开始战斗按钮状态
            startBtn.disabled = this.selectedCharacters.length === 0;
        }
    }

    // 设置事件委托（只需绑定一次，在容器级别）
    setupEventDelegation() {
        // 防止重复绑定
        if (this.eventsBound) return;

        const selector = document.getElementById('character-selector');
        if (!selector) return;

        // 在选人界面容器上使用事件委托
        selector.addEventListener('click', (e) => {
            // 处理角色卡片点击
            const card = e.target.closest('.character-card');
            if (card && !e.target.closest('.selected-badge')) {
                const characterName = card.dataset.characterName;
                if (characterName) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleCharacter(characterName);
                    return;
                }
            }

            // 处理移除按钮点击
            if (e.target.classList.contains('remove-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(e.target.dataset.index);
                if (!isNaN(index)) {
                    this.removeCharacter(index);
                    return;
                }
            }

            // 处理开始战斗按钮点击
            if (e.target.id === 'start-battle-btn' || e.target.closest('#start-battle-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.startBattle();
                return;
            }
        });

        // 标记事件已绑定
        this.eventsBound = true;
    }

    // 切换角色选择状态
    toggleCharacter(characterName) {
        const index = this.selectedCharacters.findIndex(c => c.name === characterName);

        if (index >= 0) {
            // 已选择，移除
            this.selectedCharacters.splice(index, 1);
            console.log(`移除角色: ${characterName}，当前选择: ${this.selectedCharacters.length}`);
        } else {
            // 未选择，添加（最多4个）
            if (this.selectedCharacters.length >= 4) {
                alert('最多只能选择4名角色！');
                return;
            }

            const charInfo = this.availableCharacters.find(c => c.name === characterName);
            if (charInfo) {
                this.selectedCharacters.push(charInfo);
                console.log(`添加角色: ${characterName}，当前选择: ${this.selectedCharacters.length}`);
            } else {
                console.warn(`未找到角色: ${characterName}`);
                return;
            }
        }

        // 重新渲染（不需要重新绑定事件，因为使用了事件委托）
        this.renderCharacterCards();
        this.renderSelectedList();
    }

    // 移除角色
    removeCharacter(index) {
        if (index >= 0 && index < this.selectedCharacters.length) {
            const removedChar = this.selectedCharacters[index];
            this.selectedCharacters.splice(index, 1);
            console.log(`通过移除按钮移除角色: ${removedChar.name}，当前选择: ${this.selectedCharacters.length}`);

            // 重新渲染（不需要重新绑定事件，因为使用了事件委托）
            this.renderCharacterCards();
            this.renderSelectedList();
        }
    }

    // 开始战斗
    startBattle() {
        if (this.selectedCharacters.length === 0) {
            alert('请至少选择1名角色！');
            return;
        }

        // 创建选中的角色实例
        const selectedCharacterInstances = this.selectedCharacters.map(charInfo => {
            return this.characterLoader.createCharacter(charInfo.name);
        }).filter(char => char !== null);

        // 触发事件，通知主程序开始战斗
        const event = new CustomEvent('charactersSelected', {
            detail: {
                characters: selectedCharacterInstances
            }
        });
        window.dispatchEvent(event);
    }
}

window.CharacterSelector = CharacterSelector;

