<script lang="ts">
	import Header from '$lib/Header.svelte';
	import { approvedPools, connectedAddress, nodes, ownedNodes, user } from '$lib/stores.js';
	import PoolList from '$lib/PoolList.svelte';
	import NodeElement from '$lib/NodeElement.svelte';
	import type { KoinosNode } from '$lib/types';
	import { pobWrite, updateOwnedNodes, updateStoredObjectFormats, updateUsers } from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import Card from '$lib/Card.svelte';


	let timer: NodeJS.Timer;
  let debounceTimer: NodeJS.Timer;
  let nodeEditor: any = null;
  let confirmModal: any = null;
	let nodePicker: any = null;


	// data from the load function in +page.ts
	export let data: any;
  nodes.set(data.nodes);
  // keep the list of owned nodes fresh through changes
  $: updateOwnedNodes($nodes, $user);

	// update stored users reference any time user is updated
  // $: console.log($user);
  $: updateUsers($user);
  $: debouncedChange($connectedAddress); // hack to reload when userChangedEvent changes
  $: debouncedChange($user.customRpc.url + $user.selectedRpcUrl);
  // $: console.log($user.customRpc + $user.selectedRpcUrl);

	// don’t react to event unless events have paused for more than 200ms
	function debouncedChange(event: any = null) {
    if (!timer) { return; } // not mounted yet
    
    clearTimeout(debounceTimer);
		debounceTimer = setTimeout(async () => {
      // console.log(event);
      load();
		}, 200);
  }

	onMount(async () => {

    updateStoredObjectFormats();

		load();
		timer = setInterval(() => {
			load();
		}, 30000);
	});
	onDestroy(async () => {
		clearInterval(timer);
	});


	async function load() {
	}




	function addNode(value: KoinosNode) {
    if ($user.nodes.some(x => x.public_key === value.public_key)) {
      let n = $user.nodes.find(x => x.public_key == value.public_key) as KoinosNode;
      n.name = value.name;
      $user.nodes = $user.nodes;
    }
    else {
      $user.nodes.push(value);
    }
    $user.nodes = $user.nodes;
  }
  function editNode(public_key: string) {
    const n = $user.nodes.find(x => x.public_key == public_key);
    nodeEditor.title = "Edit node";
    nodeEditor.positiveActionName = "Save";
    nodeEditor.show(n);
  }
  function removeNode(public_key: string) {
    confirmModal.title = "Really remove Node?";
    confirmModal.positiveActionName = "Remove Node"
    confirmModal.message = "You will no longer see this node in your list.  You may add it again at any time using its public key ("+public_key+").";
    confirmModal.buttonAction = () => {
      $user.nodes = $user.nodes.filter(node => {
        return node.public_key !== public_key;
      });
    }
    confirmModal.show();
  }
  function linkPoolWithNode(poolAddress: string) {
    let options:{name: string, value: string}[] = [];
    $user.nodes.forEach(node => {
      options.push({name: node.name, value: node.public_key});
    });
    nodePicker.options = options;
    nodePicker.buttonAction = (nodePublicKey: string) => {
      pobWrite("register_public_key", {producer: poolAddress, public_key: nodePublicKey}, "linking").then((result) => {
        $user = $user;  // update ui
      });
    }
    nodePicker.show("");
  }


</script>

<svelte:head>
	<title>KoinForge nodes</title>
	<meta name="description" content="List of pools" />
</svelte:head>

<div class="px-4">

	<Header />

	{#if $page.url.toString().includes("127.0.0.1:")}
		<section class="grid grid-cols-1 gap-4 lg:gap-8 max-w-[1300px] mx-auto pt-20">
			<div class="text-lg font-semibold">Your nodes:</div>
			{JSON.stringify($nodes)}
			<div class="rounded-xl bg-base-200 mt-2">
				{#each $ownedNodes as node, i}
					<NodeElement node={node} editAction={editNode} removeAction={removeNode} />
					{#if i < ($ownedNodes.length-1)}<div class="h-[1px] bg-base-300 mx-4"></div>{/if}
				{/each}
			</div> 
		</section>



	{:else}
		<div class="hero min-h-screen bg-gradient-to-br from-[#ff1b0a] to-[#ffff00e3]">
			<Card>
				<div class="text-xl text-center mt-30 py-20 px-32">Coming "soon"</div>
			</Card>
		</div>
	{/if}

</div>


<style>
</style>
