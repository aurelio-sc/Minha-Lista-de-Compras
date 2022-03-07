<script>

  let newQuantity = '';
  let newItem = '';

  let itemList = [];


function addToList() {
  itemList = [...itemList, {text: newItem, number: newQuantity}];
  newItem = '';
  newQuantity = '';
};

function removeFromList(index) {
  itemList.splice(index, 1)
  itemList = itemList;
  };

</script>

<div class="list">

  <!--❌-->  

  {#each itemList as item, index}
    <div class="newListItem">
      <span class="quantity">{item.number}</span>
      <span  class="itemName">{item.text}</span>
      <span on:click={() => removeFromList(index)} class="removeButton">🛇</span>
      <br/>
    </div>
  {/each} 
  

  <input bind:value={newQuantity} type="number" placeholder="Quant." class="quantity">
  <input bind:value={newItem} type="text" placeholder="Novo item" class="item">
  <button on:click={addToList} class="addButton">✚</button>

  <br/>

</div>

<style> 

.newListItem{
  display: flex;
  justify-content: center;
  align-items: center;
}

.quantity{
  width: 5rem;
}

.item{
  width: 15rem;
  text-align: start;
}

.itemName{
  width: 15rem;
}

.removeButton{
  color:red;
  font-weight: bold;
  font-size: 1.2rem;
}

.addButton{
  color:blue;
  background: none;
}
</style>

<!--
    Todo:
-->