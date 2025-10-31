class SkillExecutor {
    constructor() {
        this.skillFunctions = {
            basicAttack: this.executeBasicAttack.bind(this),
            fangsuSkill: this.executeFangsuSkill.bind(this),
            fangsuUltimate: this.executeFangsuUltimate.bind(this),
            fangsuDeathSword: this.executeFangsuDeathSword.bind(this),
            healSkill: this.executeHealSkill.bind(this),
            buffSkill: this.executeBuffSkill.bind(this),
            silverWolfFollowUp: this.executeSilverWolfFollowUp.bind(this),
            spreadAttack: this.executeSpreadAttack.bind(this),      // 新增：扩散攻击
            bounceAttack: this.executeBounceAttack.bind(this)       // 新增：弹射攻击
        };
    }

    executeBasicAttack(user, target, allCharacters) {
        const baseDamage = user.attack;
        const damageType = user.skills[SkillType.BASIC].damageType;
        const skillType = SkillType.BASIC;

        const result = user.calculateFinalDamage(baseDamage, damageType, skillType);
        const survived = target.takeDamage(result.damage, damageType);

        const critText = result.isCrit ? " (暴击!)" : "";
        const damageTypeText = this.getDamageTypeText(damageType);

        user.gameState.addLog(
            `${user.name}使用<span style="color: ${user.skills[SkillType.BASIC].getDamageTypeColor()}">普通攻击</span>，` +
            `对${target.name}造成 <span class="damage">${result.damage}${critText}</span>点${damageTypeText}伤害`,
            'damage'
        );

        if (survived && user.canTriggerFollowUp(skillType, target)) {
            setTimeout(() => {
                user.executeFollowUpAttack(target, allCharacters);
            }, 500);
        }

        return survived;
    }

    executeSilverWolfFollowUp(user, target, allCharacters) {
        const baseDamage = user.attack * 1.2;
        const damageType = DamageType.ICE;
        const skillType = SkillType.SPECIAL;

        const result = user.calculateFinalDamage(baseDamage, damageType, skillType);
        const survived = target.takeDamage(result.damage, damageType);

        const critText = result.isCrit ? " (暴击!)" : "";
        const damageTypeText = this.getDamageTypeText(damageType);

        user.gameState.addLog(
            `${user.name}触发<span style="color: #ba68c8">狼魂追击</span>！` +
            `对${target.name}造成 <span class="damage">${result.damage}${critText}</span>点${damageTypeText}追加伤害`,
            'damage'
        );

        return survived;
    }

    // 新增：扩散攻击执行函数
    executeSpreadAttack(user, mainTarget, allCharacters) {
        const baseDamage = user.attack * 1.5;
        const spreadDamage = user.attack * 1.0;
        const damageType = DamageType.FIRE;
        const skillType = SkillType.SKILL;

        // 获取主目标周围的敌人
        const enemies = allCharacters.filter(char =>
            char.type === 'enemy' && char.currentHp > 0 && char !== mainTarget
        );

        const spreadTargets = enemies.slice(0, 2);

        // 攻击主目标
        const mainResult = user.calculateFinalDamage(baseDamage, damageType, skillType);
        const mainSurvived = mainTarget.takeDamage(mainResult.damage, damageType);

        const critText = mainResult.isCrit ? " (暴击!)" : "";
        user.gameState.addLog(
            `${user.name}使用<span style="color: #ff8e53">扩散攻击</span>，` +
            `对${mainTarget.name}造成 <span class="damage">${mainResult.damage}${critText}</span>点伤害`,
            'damage'
        );

        // 攻击扩散目标
        spreadTargets.forEach(target => {
            const spreadResult = user.calculateFinalDamage(spreadDamage, damageType, skillType);
            const spreadSurvived = target.takeDamage(spreadResult.damage, damageType);

            const spreadCritText = spreadResult.isCrit ? " (暴击!)" : "";
            user.gameState.addLog(
                `扩散效果对${target.name}造成 <span class="damage">${spreadResult.damage}${spreadCritText}</span>点伤害`,
                'damage'
            );
        });

        // 扩散攻击后检查追加攻击
        if (mainSurvived && user.canTriggerFollowUp(skillType, mainTarget)) {
            setTimeout(() => {
                user.executeFollowUpAttack(mainTarget, allCharacters);
            }, 500);
        }

        return mainSurvived;
    }

    executeAttackSkill(user, target, allCharacters) {
        const baseDamage = user.attack;
        const damageType = user.skills[SkillType.BASIC].damageType;
        const skillType = SkillType.SPECIAL;

        const result = user.calculateFinalDamage(baseDamage, damageType, skillType);
        const survived = target.takeDamage(result.damage, damageType);

        const critText = result.isCrit ? " (暴击!)" : "";
        const damageTypeText = this.getDamageTypeText(damageType);

        user.gameState.addLog(
            `${user.name}发动追加攻击，` +
            `对${target.name}造成 <span class="damage">${result.damage}${critText}</span>点${damageTypeText}伤害`,
            'damage'
        );

        return survived;
    }


    // 新增：弹射攻击执行函数
    executeBounceAttack(user, target, allCharacters) {
        const baseDamage = user.attack * 0.8; // 每次弹射80%伤害
        const damageType = DamageType.LIGHTNING;
        const skillType = SkillType.SKILL;

        const enemies = allCharacters.filter(char =>
            char.type === 'enemy' && char.currentHp > 0
        );

        // 随机弹射3-5次
        const bounceCount = Math.floor(Math.random() * 3) + 3;
        let totalDamage = 0;

        user.gameState.addLog(
            `${user.name}使用<span style="color: ${user.skills[SkillType.SKILL].getDamageTypeColor()}">弹射攻击</span>，` +
            `将在敌人间弹射${bounceCount}次`,
            'damage'
        );

        for (let i = 0; i < bounceCount && enemies.length > 0; i++) {
            // 随机选择一个目标
            const randomIndex = Math.floor(Math.random() * enemies.length);
            const bounceTarget = enemies[randomIndex];

            const result = user.calculateFinalDamage(baseDamage, damageType, skillType);
            const survived = bounceTarget.takeDamage(result.damage, damageType);
            totalDamage += result.damage;

            const critText = result.isCrit ? " (暴击!)" : "";
            user.gameState.addLog(
                `第${i + 1}次弹射对${bounceTarget.name}造成 <span class="damage">${result.damage}${critText}</span>点伤害`,
                'damage'
            );

            // 如果目标死亡，从列表中移除
            if (!survived) {
                enemies.splice(randomIndex, 1);
            }
        }

        user.gameState.addLog(
            `弹射攻击总计造成 <span class="damage">${totalDamage}</span>点伤害`,
            'damage'
        );

        return true;
    }

    executeFangsuSkill(user, target, allCharacters) {
        const enemies = allCharacters.filter(char => char.type === 'enemy' && char.currentHp > 0);
        const baseDamage = user.attack * 2;
        const damageType = DamageType.QUANTUM;
        const skillType = SkillType.SKILL;
        let allSurvived = true;

        enemies.forEach(enemy => {
            const result = user.calculateFinalDamage(baseDamage, damageType, skillType);
            const survived = enemy.takeDamage(result.damage, damageType);
            if (!survived) allSurvived = false;

            const critText = result.isCrit ? " (暴击!)" : "";
            const damageTypeText = this.getDamageTypeText(damageType);

            user.gameState.addLog(
                `${user.name}使用<span style="color: ${user.skills[SkillType.SKILL].getDamageTypeColor()}">战技</span>，` +
                `对${enemy.name}造成 <span class="damage">${result.damage}${critText}</span>点${damageTypeText}伤害`,
                'damage'
            );

            // 直接检查并执行追加攻击，不使用 performAttack
            if (survived && user.canTriggerFollowUp(skillType, enemy)) {
                setTimeout(() => {
                    user.executeFollowUpAttack(enemy, allCharacters);
                }, 500);
            }
        });

        return allSurvived;
    }

    // 新增：普通攻击的替代执行函数（用于追击等）
    executeAttackSkill(user, target, allCharacters) {
        const baseDamage = user.attack;
        const damageType = user.skills[SkillType.BASIC].damageType;
        const skillType = SkillType.BASIC;

        const result = user.calculateFinalDamage(baseDamage, damageType, skillType);
        const survived = target.takeDamage(result.damage, damageType);

        const critText = result.isCrit ? " (暴击!)" : "";
        const damageTypeText = this.getDamageTypeText(damageType);

        user.gameState.addLog(
            `${user.name}发动攻击，` +
            `对${target.name}造成 <span class="damage">${result.damage}${critText}</span>点${damageTypeText}伤害`,
            'damage'
        );

        return survived;
    }


    executeFangsuUltimate(user, target, allCharacters) {
        user.isSwordActive = true;
        user.swordTimer = 30;

        const allies = allCharacters.filter(char => char.type === 'ally');
        allies.forEach(ally => {
            if (ally.name === "钫酸") {
                ally.addStatusEffect(new StatusEffect(
                    "宝具伤害加成", 30, 0, 0, 0, 0.5, 0
                ));
            } else {
                ally.addStatusEffect(new StatusEffect(
                    "最终伤害增加", 30, 1.0
                ));
                ally.addStatusEffect(new StatusEffect(
                    "免疫死亡", 30, 0, 0, 0, 0, 0, true
                ));
            }
        });

        const enemies = allCharacters.filter(char => char.type === 'enemy');
        enemies.forEach(enemy => {
            enemy.addStatusEffect(new StatusEffect(
                "技能沉默", 30, 0, 0, 0, 0, 0, false, true
            ));
            enemy.addStatusEffect(new StatusEffect(
                "受到伤害增加", 30, 0, 0, 0, 0, 1.0
            ));
        });

        user.gameState.addLog(
            `${user.name}释放终结技 - 生死别离！所有友方获得伤害加成和免死效果，敌方被沉默并受到伤害增加`,
            'buff'
        );

        return true;
    }

    executeFangsuDeathSword(user, target, allCharacters) {
        if (!user.isSwordActive) {
            user.gameState.addLog("宝剑未激活，无法使用死之剑", 'debuff');
            return true;
        }

        const enemies = allCharacters.filter(char => char.type === 'enemy' && char.currentHp > 0);
        const baseDamage = user.attack * 2;
        const damageType = DamageType.PURE;
        const skillType = SkillType.SPECIAL;
        const result = user.calculateFinalDamage(baseDamage, damageType, skillType);
        let allSurvived = true;

        enemies.forEach(enemy => {
            const damage = result.damage * 2;
            const survived = enemy.takeDamage(damage, damageType);
            if (!survived) allSurvived = false;

            const critText = result.isCrit ? " (暴击! 无敌贯穿)" : " (无敌贯穿)";
            const damageTypeText = this.getDamageTypeText(damageType);

            user.gameState.addLog(
                `${user.name}使用<span style="color: ${user.skills[SkillType.SPECIAL].getDamageTypeColor()}">死之剑</span>，` +
                `对${enemy.name}造成 <span class="damage">${damage}${critText}</span>点${damageTypeText}伤害`,
                'damage'
            );
        });

        return allSurvived;
    }

    executeHealSkill(user, target, allCharacters) {
        console.log('执行治疗技能:', user.name, '目标:', target);

        // 确定治疗目标
        let healTargets = [];

        if (target) {
            // 如果有指定目标，治疗该目标
            healTargets = [target];
        } else {
            // 如果没有指定目标，治疗所有友方
            healTargets = allCharacters.filter(char =>
                char.type === 'ally' && char.currentHp > 0
            );
        }

        // 如果没有找到治疗目标，记录日志并返回
        if (healTargets.length === 0) {
            user.gameState.addLog(`${user.name}使用治疗技能，但没有找到可治疗的目标`, 'debuff');
            return true;
        }

        let totalHeal = 0;
        healTargets.forEach(healTarget => {
            const healAmount = Math.floor(user.attack * 0.8);

            // 防御性检查：确保目标存在且有 heal 方法
            if (healTarget && typeof healTarget.heal === 'function') {
                healTarget.heal(healAmount);
                totalHeal += healAmount;

                user.gameState.addLog(
                    `${user.name}使用<span style="color: #00ff88">治疗之雨</span>，` +
                    `为${healTarget.name}恢复 <span class="heal">${healAmount}</span>点生命值`,
                    'heal'
                );
            } else {
                console.error('治疗目标无效:', healTarget);
                user.gameState.addLog(`${user.name}的治疗技能执行失败，目标无效`, 'debuff');
            }
        });

        return true;
    }


    executeBuffSkill(user, target, allCharacters) {
        console.log('执行增益技能:', user.name, '目标:', target);

        // 确定增益目标
        let buffTargets = [];

        if (target) {
            // 如果有指定目标，对该目标施放增益
            buffTargets = [target];
        } else {
            // 如果没有指定目标，对自己施放增益
            buffTargets = [user];
        }

        buffTargets.forEach(buffTarget => {
            // 防御性检查：确保目标存在
            if (buffTarget && typeof buffTarget.addStatusEffect === 'function') {
                const buffEffect = new StatusEffect(
                    "战意激发",
                    3,
                    0,
                    0.3,
                    0.4,
                    0,
                    0
                );
                buffTarget.addStatusEffect(buffEffect);

                user.gameState.addLog(
                    `${user.name}使用<span style="color: #a78bfa">战意激发</span>，` +
                    `${buffTarget.name}获得 <span class="buff">普通攻击+30%、战技+40%</span>伤害加成`,
                    'buff'
                );
            } else {
                console.error('增益目标无效:', buffTarget);
                user.gameState.addLog(`${user.name}的增益技能执行失败，目标无效`, 'debuff');
            }
        });

        return true;
    }

    executeFollowUpAttack(user, target, allCharacters) {
        const baseDamage = user.attack * 1.2;
        const damageType = DamageType.ICE;
        const skillType = SkillType.SPECIAL;

        const result = user.calculateFinalDamage(baseDamage, damageType, skillType);
        const survived = target.takeDamage(result.damage, damageType);

        const critText = result.isCrit ? " (暴击!)" : "";
        const damageTypeText = this.getDamageTypeText(damageType);

        user.gameState.addLog(
            `${user.name}发动<span style="color: #ba68c8">追加攻击</span>，` +
            `对${target.name}造成 <span class="damage">${result.damage}${critText}</span>点${damageTypeText}伤害`,
            'damage'
        );

        return survived;
    }

    getDamageTypeText(damageType) {
        const texts = {
            [DamageType.PHYSICAL]: '物理',
            [DamageType.FIRE]: '火属性',
            [DamageType.ICE]: '冰属性',
            [DamageType.LIGHTNING]: '雷属性',
            [DamageType.QUANTUM]: '量子',
            [DamageType.IMAGINARY]: '虚数',
            [DamageType.WIND]: '风属性',
            [DamageType.PURE]: '纯粹'
        };
        return texts[damageType] || '';
    }

    getSkillFunction(funcName) {
        return this.skillFunctions[funcName];
    }
}

window.SkillExecutor = SkillExecutor;