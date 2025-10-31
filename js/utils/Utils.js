class Utils {
    static clamp(value, min, max) {
        return Math.max(min, Math.min(value, max));
    }
    
    static calculatePercentage(current, maximum) {
        if (maximum === 0) return 0;
        return (current / maximum) * 100;
    }
    
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static formatNumber(number) {
        return number.toLocaleString();
    }
}

window.Utils = Utils;