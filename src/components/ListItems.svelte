<script>

  let newQuantity = '';
  let newItem = '';

  let quantityList = [];
  let todoList = [];

function addToList() {
  todoList = [...todoList, {text: newItem, status: false}];
  quantityList = [...quantityList, { text: newQuantity}]
  newItem = '';
  newQuantity = '';
}

function removeFromList(index) {
  todoList.splice(index, 1)
  quantityList.splice(index,1)
  todoList = todoList;
  quantityList = quantityList;
  }
</script>

<input bind:value={newQuantity} type="text" placeholder="Quant.">
<input bind:value={newItem} type="text" placeholder="Novo item">
<button on:click={addToList}>Adicionar</button>

<br/> <!--Fazer a quantidade aparecer!-->
{#each todoList as item, index}
<input bind:checked={item.status} type="checkbox">
<span class:checked={item.status}>{item.text}</span>
<span on:click={() => removeFromList(index)}>❌</span>
<br/>
{/each} 


<style> 
.checked {
      text-decoration: line-through;
  }
</style> 