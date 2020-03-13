# DatePicker
移动端滚动式日期控件，平滑滚动，超小体积，原生js编写，不依赖第三方文件。

## 快速开始
1、引入文件
```HTML
<!-- 样式文件 -->
<link rel="stylesheet" href="path/to/datepicker.css" />

<!-- 脚本文件 -->
<script src="path/to/datepicker.js"></script>
```
2、在input上加上role="datepicker"，就这么简单
```HTML
<input type="text" role="datepicker" readonly />
```

## 更多功能
1、日期格式默认为 yyyy-MM-dd，如果你想自定义格式，添加 data-format
```HTML
<input type="text" role="datepicker" data-format="yyyy/MM/dd" readonly />
```
2、如果你只想选年月
```HTML
<input type="text" role="datepicker" data-format="yyyy-MM" readonly />
```
3、想要初始值，简单
```HTML
<input type="text" role="datepicker" value="2016-10-10" readonly />
```
