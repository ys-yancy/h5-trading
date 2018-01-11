module.exports = {
    Wi: [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1], // 加权因子
    ValideCode: [1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2], // 身份证验证位值.10代表X

    idCardValidate: function(idCard) {
        idCard = this.trim(idCard.replace(/\s+/g, ""));
        if (idCard.length == 15) {
            return this.isValidityBrithBy15IdCard(idCard);
        }
        else if (idCard.length == 18) {
            var idCards = idCard.split(""); // 得到身份证数组
            if (isValidityBrithBy18IdCard(idCard) && isTrueValidateCodeBy18IdCard(idCards)) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    },

    // 判断身份证号码为18位时最后的验证位是否正确
    isTrueValidateCodeBy18IdCard: function(idCards) {
        var sum = 0; // 声明加权求和变量
        if (idCards[17].toLowerCase() == 'x') {
            idCards[17] = 10; // 将最后位为x的验证码替换为10方便后续操作
        }

        for (var i = 0; i < 17; i++) {
            sum += this.Wi[i] * idCards[i]; // 加权求和
        }

        var valCodePosition = sum % 11;

        if (idCards[17] == this.ValideCode[valCodePosition]) {
            return true;
        } else {
            return false;
        }
    },

    // 验证18位数身份证号码中的生日是否是有效生日
    isValidityBrithBy18IdCard: function(idCard18) {
        var year = idCard18.substring(6, 10),
            month = idCard18.substring(10, 12),
            day = idCard18.substring(12, 14);
        
        var temp_date = new Date(year, parseFloat(month) - 1, parseFloat(day));
        // 这里用getFullYear()获取年份，避免千年虫问题
        if (temp_date.getFullYear() != parseFloat(year) || temp_date.getMonth() != parseFloat(month) - 1 || temp_date.getDate() != parseFloat(day)) {
            return false;
        } else {
            return true;
        }
    },

    // 验证15位数身份证号码中的生日是否是有效生日
    isValidityBrithBy15IdCard: function() {
        var year = idCard15.substring(6, 8),
            month = idCard15.substring(8, 10),
            day = idCard15.substring(10, 12),
            temp_date = new Date(year, parseFloat(month) - 1, parseFloat(day));

        // 对于老身份证中的你年龄则不需考虑千年虫问题而使用getYear()方法
        if (temp_date.getYear() != parseFloat(year) || temp_date.getMonth() != parseFloat(month) - 1 || temp_date.getDate() != parseFloat(day)) {
            return false;
        } else {
            return true;
        }
    },

    // 通过身份证判断是男是女
    // @return 'female'-女、'male'-男
    maleOrFemalByIdCard: function(idCard) {
        idCard = this.trim(idCard.replace(/\s+/g, "")); // 对身份证号码做处理。包括字符间有空格。
        if (idCard.length == 15) {
            if (idCard.substring(14, 15) % 2 == 0) {
                return 'female';
            } else {
                return 'male';
            }
        } else if (idCard.length == 18) {
            if (idCard.substring(14, 17) % 2 == 0) {
                return 'female';
            } else {
                return 'male';
            }
        } else {
            return null;
        }
    },

    trim: function(str) {
        return str.trim();
    }
}