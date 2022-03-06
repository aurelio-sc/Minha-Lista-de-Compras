<script>

  let newQuantity = '';
  let newItem = '';

  let quantityList = [];
  let itemList = [];

function addToList() {
  itemList = [...itemList, {text: newItem}];
  quantityList = [...quantityList, {number: newQuantity}]
  newItem = '';
  newQuantity = '';
};

function removeFromList(index) {
  itemList.splice(index, 1)
  quantityList.splice(index,1)
  itemList = itemList;
  quantityList = quantityList;
  };

</script>

<div class="list">

  <div class="newListItem">
    {#each quantityList as item, index}
    <span class="quantity">{item.number}</span>
    <br/>
    {/each}


    {#each itemList as item, index}

    <span class:checked={item.status} class="item">{item.text}</span>
    <span on:click={() => removeFromList(index)}>❌</span>
    <br/>
    {/each} 
  </div>

  <input bind:value={newQuantity} type="number" placeholder="Quant." class="quantity">
  <input bind:value={newItem} type="text" placeholder="Novo item" class="item">
  <button on:click={addToList}>Adicionar</button>

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
  width: 10rem;
  text-align: start;
}
</style>

<!--Centralizar os items da lista
    Alterar ícone de remover
    Substituir o botão adicionar por uma imagem-->