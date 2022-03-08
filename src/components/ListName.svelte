
        <!--ALTERANDO O NOME DA LISTA-->
<script>

let listName={text:'', status:false};
let showListNameInput=true;

function updateListName(){
  listName.text=listName.text;
  listName.status=true;
  showListNameInput=false;
}

function editListName(){
showListNameInput=true;
listName.status=false;

}
</script>


<main>
  <div class={listName.status} id="showName">
    <p>{listName.text}</p>
    <button on:click={editListName} class="editButton">Alterar</button>
  </div>
  <div class={showListNameInput} id="editName">
    <input bind:value={listName.text} type="text" placeholder="Nome da lista">
    <button on:click={updateListName} class="editButton">Confirmar</button>
  </div>
</main>

<style>

  main {
    border-bottom: 1px solid;
    margin-bottom: 1rem;
  }

  .false{
    display: none;
  }

  .true{
    display:flex;
    justify-content: space-evenly;
    align-items: center;
  }

  .editButton{
    background:none;
  }
</style>