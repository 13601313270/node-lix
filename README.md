# 前后端一体化应用


这个项目介绍了一种代码开发方面的探索的演示

中后台项目中，带有Node的项目，我们总是维护两个js项目：Node项目+View项目

两者之间通过Api地址链接，新的一体化应用，通过特殊的__service__作用域，可以将两者代码写在一起。所有在`__service__`内部的代码都会在服务器执行

## 更多
使用lix一体化开发，过去我们需要在两个项目里维护代码，现在可以前后端js代码写在一起。

![avatar](https://img.alicdn.com/tfs/TB1TUA3fkcx_u4jSZFlXXXnUFXa-1920-1080.jpg)

##所有在`__service__`内部的代码都会在服务器端执行


## 实现方式

通过webpack插件，将源码，提取到两个项目中
![avatar](https://img.alicdn.com/tfs/TB1OEliSEY1gK0jSZFMXXaWcVXa-2078-1160.jpg)
