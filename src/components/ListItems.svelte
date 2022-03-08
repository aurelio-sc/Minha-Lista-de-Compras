
        <!--CRIANDO DA LISTA DE COMPRAS-->
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

  {#each itemList as item, index}
    <div class="newListItem">
      <span class="quantity">{item.number}</span>
      <span  class="itemName">{item.text}</span>
      <span on:click={() => removeFromList(index)} class="removeButton">❌</span>
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
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
}

.quantity{
  width: 20%;
}

.item{
  width: 65%;
  text-align: start;
}

.itemName{
  width: 65%;
}

.addButton{
  color:blue;
  background: none;
  width: 10%;
}
</style>