<script lang="ts">

  // TODO:
  // - More explanations of what things are and how they work. Some of this can be with tooltips
  // - 'How to run a node' needs to be implemented 
  // - Add vapor, vhp, and koinos logos to wallet displays

	import Header from '$lib/Header.svelte';
	import Card from '$lib/Card.svelte';
	import vaporLogo from '$lib/images/vapor-icon.svg?raw';
	import { approvedPools, connectedAddress, nodes, ownedNodes, ownedPools, submittedPools, user } from '$lib/stores.js';
	import { onDestroy, onMount } from 'svelte';
	import PoolCreator from '$lib/PoolCreator.svelte';
	import { pobWrite, populateOwnedPools, updateStoredObjectFormats, updateUsers, loadFogataPools, poolsWrite, readPoolsOwner, userIsPoolsOwner, updateOwnedNodes } from '$lib/utils';
	import PoolListElement from '$lib/PoolListElement.svelte';
	import type { KoinosNode } from '$lib/types';
	import NodeElement from '$lib/NodeElement.svelte';
	import InputsModal from '$lib/InputsModal.svelte';
	import SelectModal from '$lib/SelectModal.svelte';
  import waveDividerRaw from '$lib/images/wave-divider.svg?raw';
  import waveDivider from '$lib/images/wave-divider.svg';
	import { utils } from 'koilib';
	import { AnalyticsOutline, AnalyticsSharp, ArrowUpOutline, ArrowUpSharp, GitNetworkOutline, GitNetworkSharp, HandRightOutline, ThumbsUp, ThumbsUpOutline, ThumbsUpSharp } from 'svelte-ionicons';

	let timer: NodeJS.Timer;
  let debounceTimer: NodeJS.Timer;
  let poolEditor: any = null;
  let nodeEditor: any = null;
  let poolAdder: any = null;
  let nodePicker: any = null;
  let confirmModal: any = null;
  let showSubmittedPools: boolean = false;

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
      populateOwnedPools();
      await loadFogataPools();
      load();
		}, 200);
  }

	onMount(async () => {

    // updateStoredObjectFormats();
    // populateOwnedPools();
    // readPoolsOwner();
    // await loadFogataPools();
    
		load();
		timer = setInterval(() => {
			load();
		}, 30000);
	});
	onDestroy(async () => {
		clearInterval(timer);
	});

	async function load() {
		$approvedPools.forEach(pool => {
			pool.refresh().then(() => {
				$approvedPools = $approvedPools;
			});
		});
    if (showSubmittedPools) {
      $submittedPools.forEach(pool => {
			pool.refresh().then(() => {
				$submittedPools = $submittedPools;
			});
		});
    }
    $ownedPools.forEach(pool => {
			pool.refresh().then(() => {
				$ownedPools = $ownedPools;
			});
    });
	}
  function addPool(value: any) {
    if (!$user.ownedPools.includes(value.address)) {
      $user.ownedPools.push(value.address);
      $user.ownedPools = $user.ownedPools;
    }
  }
  function removePool(address: string) {
    confirmModal.title = "Really remove Pool?";
    confirmModal.positiveActionName = "Remove Pool";
    confirmModal.message = "This will not delete the pool contract, but you will no longer see it in your list.  You may add it again at any time using its address ("+address+").";
    confirmModal.buttonAction = () => {
      $user.ownedPools = $user.ownedPools.filter(item => item !== address);
    }
    confirmModal.show();
  }
  function submitPool(address: string) {
    confirmModal.title = "Submit pool for listing on Fogata?";
    confirmModal.positiveActionName = "Submit Pool";
    confirmModal.message = "Your node will be reviewed for efficacy and security. This transaction will consume mana.";
    confirmModal.buttonAction = () => {
      poolsWrite("submit_pool", {account: address}, "pool submission").then((transaction) => {
        console.log(transaction);
        transaction?.wait("byBlock", 30000).then(() => { loadFogataPools(); });
      });
    }
    confirmModal.show();
  }
  function delistPool(address: string) {
    confirmModal.title = "Remove pool from Fogata?";
    confirmModal.positiveActionName = "Remove Pool";
    confirmModal.message = "The pool will be removed for all Fogata users. Any depositors to this pool may be unable to withdraw. Pool address: "+address+".";
    confirmModal.buttonAction = () => {
      poolsWrite("remove_pool", {account: address}, "pool removal").then((transaction) => {
        transaction?.wait("byBlock", 30000).then(() => { loadFogataPools(); });
      });
    }
    confirmModal.show();
  }
  function approvePool(address: string) {
    confirmModal.title = "Approve pool for listing on Fogata?";
    confirmModal.positiveActionName = "Approve Pool";
    confirmModal.message = "Once the pool is approved, it will become visible on Fogata and is more likely to receive deposits.";
    confirmModal.buttonAction = () => {
      poolsWrite("approve_pool", {account: address}, "pool approval").then((transaction) => {
        transaction?.wait("byBlock", 30000).then(() => { loadFogataPools(); });
      });
    }
    confirmModal.show();
  }
  function showPoolStats(address: string) {
    const p = $submittedPools.find(x => x.address == address) || $approvedPools.find(x => x.address == address) ||  $ownedPools.find(x => x.address == address);
    confirmModal.title = "Pool information";
    confirmModal.positiveActionName = "Hide";
    confirmModal.showNegativeAction = false;
    confirmModal.message = "Address: "+address+"\n\n"+JSON.stringify(p?.parameters, null, 2);
    confirmModal.show();
  }
  function showNodeInstructions() {
    confirmModal.title = "How to run your own node";
    confirmModal.positiveActionName = "Done";
    confirmModal.showNegativeAction = false;
    confirmModal.message = "Official Koinos node documentation is at https://docs.koinos.io/quickstart/running-a-koinos-node.html";
    confirmModal.show();
  }
  function editPool(address: string) {
    const p = $ownedPools.find(x => x.address == address);
    poolEditor.address = p?.address;
    poolEditor.step = 0;
    poolEditor.mode = "edit";
    poolEditor.show(p?.parameters);
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
	<title>KoinForge</title>
	<meta name="description" content="Hosted Koinos nodes" />
</svelte:head>

<div class="">

  <Header />

  <!-- background: linear-gradient(to bottom right, hsl(4deg 100% 52%), hsl(60deg 100% 50% / 89%)); -->
  <!-- <div class="hero min-h-screen" style="background-image: url(https://placeimg.com/1000/800/arch);"> -->
  <div class="hero min-h-screen bg-gradient-to-br from-[#ff1b0a] to-[#ffff00e3]">
    
    <!-- <div class="hero-overlay bg-opacity-60"></div> -->
    <div class="hero-content text-center text-neutral-content">
      <div class="max-w-md">
        <h1 class="mb-5 text-5xl font-bold">Run your own Koinos node with just a few clicks</h1>
        <p class="mb-5">KoinForge is the simplest way to run a Koinos node, earn the highest possible APY, and take full control of your governance votes.</p>
        {#if $connectedAddress}
          <button class="btn btn-primary">Create your node</button>
        {:else}
          <button class="btn btn-primary">Connect with Kondor</button>
        {/if}
      </div>
    </div>
  </div>

  <div>
    <div class="text-4xl font-semibold text-center mt-28 mb-4 px-4">Run your own Koinos node with just a few clicks</div>

    <div class="relative overflow-hidden">
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 max-w-[1300px] mx-auto pt-16 pb-60 px-4">

        <div class="mt-4">
          KoinForge is the simplest way to run a Koinos node, earn the highest possible APY, and take full control of your governance votes.
        </div>

        <Card>
            <!-- <div class="text-[46px] font-semibold">Forge your own path forward</div> -->

            <div class="mt-4">
              It’s super-simple to start - just create your node, name it, and link it to your wallet.  VHP in your wallet will be used for mining automatically, and mining rewards will be immediately available.
            </div>
            <div class="mt-4">
              <!-- process: 1) define name, keys, producer address (wallet by default)  2) pick payment options $40 monthly, or $400 annually  3) enter credit card details -->
            </div>

            <div class="mt-3 flex gap-3 flex-wrap">
              <button class="btn btn-secondary text-secondary-content h-8 min-h-8" on:click={() => {nodeEditor?.show()}}>Create node</button>
            </div>
        </Card>


      </section>


        <!-- <img class="wd-bottom inline-svg absolute bottom-0 left-0 w-[200%] z-10 max-w-none animate-stretch [transform:translateZ(0)] text-base-100" src="{waveDivider}" alt="Cool wave" /> -->
        <!-- <img class="wd-bottom inline-svg absolute bottom-0 left-0 w-[200%] z-10 max-w-none animate-stretch [transform:translateZ(0)] text-base-100" src="{waveDivider}" alt="cool wave" /> -->
      {@html waveDividerRaw}
      <!-- testing to see if I needed to put those styles on something to get the pre-processor to use them -->
      <div class="wd-bottom inline-svg absolute bottom-0 left-0 w-[200%] z-10 max-w-none animate-stretch [transform:translateZ(0)] text-base-100"></div>

    </div>

    <!-- <section class="relative overflow-hidden"> -->
      <!-- <span class="wd-bottom inline-svg absolute bottom-0 left-0 w-[200%] z-10 max-w-none animate-stretch [transform:translateZ(0)] text-base-100">{@html waveDivider}</span> -->
    <!-- </section> -->


    <section class="bg-base-100">
      <!-- <span class="inline-svg absolute bottom-0 left-0 w-[200%] z-10 max-w-none animate-stretch [transform:translateZ(0)] text-base-100">{@html waveDivider}</span> -->

      <div class="container px-4 py-16 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-12 lg:px-8 lg:py-20">
        <h1 class="text-3xl mb-14 text-center font-semibold">A node of your own</h1>
        <h2></h2>
        <div class="flex flex-wrap sm:-m-4 -mx-4 -mb-10 -mt-4">
          
  
          <div class="p-4 md:w-1/3">
            <div class="flex rounded-xl h-full bg-base-200 p-4 lg:p-8 flex-col gap-2 items-start">
              <ArrowUpOutline class="w-12 h-12 text-primary" size="30" />
              <h3 class="text-xl font-semibold mt-2">Reliable uptime</h3>
              <p class="flex-grow leading-relaxed text-base">Leverage our cloud expertise to maximize your uptime and yield</p>
              <div class="dropdown">
                <label tabindex="0" class="btn btn-outline h-8 min-h-8 rounded-full mt-3 inline-flex items-center">Learn more
                  <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="w-4 h-4 ml-2" viewBox="0 0 24 24">
                    <path d="M5 11l7 7 7 -7"></path>
                    <!-- <path d="M12 5v14M5 12l7 7 7 -7"></path> -->
                  </svg>
                </label>
                <div tabindex="0" class="dropdown-content menu mt-2 p-6 shadow-xl bg-base-100 rounded-box w-screen max-w-[80vw] md:max-w-xl">
                  <h4 class="text-lg font-semibold">Your customers should know you care</h4>
                  <div class="mt-4">
                    <div class="flex mt-2"><div class="text-2xl">💑</div><div class="ml-3">You may not have time to personally follow up with every customer, but they still need to feel the love.</div></div>
                    <div class="flex mt-2"><div class="text-2xl">🏆</div><div class="ml-3">Configure winback promotions to trigger on their phone 22 hours after their visit.</div></div>
                    <div class="flex mt-2"><div class="text-2xl">✉️</div><div class="ml-3">Every customer who interacts with your Crowdkit page can be added to your marketing email welcome series.</div></div>
                    <div class="flex mt-2"><div class="text-2xl">🎁</div><div class="ml-3">Set up a giveaway for every visit to incentivise repeat foot traffic</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="p-4 md:w-1/3">
            <div class="flex rounded-xl h-full bg-base-200 p-4 lg:p-8 flex-col gap-2 items-start">
              <ThumbsUp class="w-12 h-12 text-accent" size="30" />
              <h3 class="text-xl font-semibold mt-2">Simple governance</h3>
              <p class="flex-grow leading-relaxed text-base">Select from active proposals, and your vote is updated in realtime</p>
              <div class="dropdown">
                <label tabindex="0" class="btn btn-outline h-8 min-h-8 rounded-full mt-3 inline-flex items-center">Learn more
                  <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="w-4 h-4 ml-2" viewBox="0 0 24 24">
                    <path d="M5 11l7 7 7 -7"></path>
                  </svg>
                </label>
                <div tabindex="0" class="dropdown-content menu mt-2 p-6 shadow-xl bg-base-100 rounded-box w-screen max-w-[80vw] md:max-w-md">
                  <h4 class="text-lg font-semibold">Because every review MATTERS</h4>
                  <p class="mt-4">Our Cloud platform improves your online review scores through a multi-faceted approach.</p>
                  <div class="mt-4">
                    <div class="flex mt-2"><div class="text-2xl">📲</div><div class="ml-3">Start reviews with just a QR code scan, increasing the number of potential reviewers.</div></div>
                    <div class="flex mt-2"><div class="text-2xl">⭐️</div><div class="ml-3">Sentiment steering gives your happiest customers the fastest path to a public review.</div></div>
                    <div class="flex mt-2"><div class="text-2xl">😃</div><div class="ml-3">Happy reviewers can be primed with specific language along the way to further improve review quality.</div></div>
                    <div class="flex mt-2"><div class="text-2xl">😩</div><div class="ml-3">Less-satisfied guests are given the opportunity to leave feedback so you can know exactly what went wrong.</div></div>
                    <div class="flex mt-2"><div class="text-2xl">🚨</div><div class="ml-3">You’re notified in realtime via text or email for all reviews and feedback, giving you the chance to thank your customer or correct any issues.</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="p-4 md:w-1/3">
            <div class="flex rounded-xl h-full bg-base-200 p-4 lg:p-8 flex-col gap-2 items-start">
              <AnalyticsOutline class="w-12 h-12 text-neutral" size="30" />
              <h3 class="text-xl font-semibold mt-2">Maximum APY</h3>
              <p class="flex-grow leading-relaxed text-base">Keep every single percent of your mining rewards</p>
              <div class="dropdown md:dropdown-end">
                <label tabindex="0" class="btn btn-outline h-8 min-h-8 rounded-full mt-3 inline-flex items-center">Learn more
                  <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="w-4 h-4 ml-2" viewBox="0 0 24 24">
                    <path d="M5 11l7 7 7 -7"></path>
                  </svg>
                </label>
                <div tabindex="0" class="dropdown-content menu mt-2 p-6 shadow-xl bg-base-100 rounded-box w-screen max-w-[80vw] md:max-w-xl">
                  <h4 class="text-lg font-semibold">Give your audience all the modern touches they expect</h4>
                  <p class="mt-4">Incentivizing contact sharing with simple, helpful perks</p>
                  <div class="mt-4">
                    <div class="flex mt-2"><div class="text-2xl">🌎</div><div class="ml-3">Quick and easy access to your Wi-Fi network</div></div>
                    <div class="flex mt-2"><div class="text-2xl">🍟</div><div class="ml-3">If you’re a restaurant, scheduled menus for breakfast, lunch, happy hour, and dinner are amazing</div></div>
                    <div class="flex mt-2"><div class="text-2xl">🎁</div><div class="ml-3">Instant promotions offer incentives for further engagement with your brand, and strong winback capabilites</div></div>
                    <div class="flex mt-2"><div class="text-2xl">🪙</div><div class="ml-3">New web3 capabilities like friction-free NFT giveaways are on our roadmap</div></div>
                    <div class="flex mt-2"><div class="text-2xl">⭐️</div><div class="ml-3">Fast and easy way to leave feedback or a review</div></div>
                  </div>              </div>
              </div>
            </div>
          </div>
  
          <div class="p-4 md:w-1/3">
            <div class="flex rounded-xl h-full bg-base-200 p-4 lg:p-8 flex-col gap-2 items-start">
              <GitNetworkOutline class="w-12 h-12 text-warning" size="30" />
              <h3 class="text-xl font-semibold mt-2">Private RPC access</h3>
                <p class="flex-grow leading-relaxed text-base">All KoinForge members receive access to our private RPC endpoint</p>
                <div class="dropdown">
                  <label tabindex="0" class="btn btn-outline h-8 min-h-8 rounded-full mt-3 inline-flex items-center">Learn more
                    <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="w-4 h-4 ml-2" viewBox="0 0 24 24">
                      <path d="M5 11l7 7 7 -7"></path>
                    </svg>
                  </label>
                  <div tabindex="0" class="dropdown-content menu mt-2 p-6 shadow-xl bg-base-100 rounded-box w-screen max-w-[80vw] md:max-w-xl">
                    <h4 class="text-lg font-semibold">Now more than ever, first party data is key to advertising success</h4>
                    <p class="mt-4">You don’t need a grand plan. Start small by building an audience of folks who interact with you.</p>
                    <div class="mt-4">
                      <div class="flex mt-2"><div class="text-2xl">👤</div><div class="ml-3">Trigger your Meta Pixel load for every interaction</div></div>
                      <div class="flex mt-2"><div class="text-2xl">✉️</div><div class="ml-3">Incentivise email and phone number sharing</div></div>
                      <div class="flex mt-2"><div class="text-2xl">👉</div><div class="ml-3">Automaticly sync your customer’s contact info directly to your email marketing platform of choice</div></div>
                      <div class="flex mt-2"><div class="text-2xl">☑️</div><div class="ml-3">Metrics on every event in your customers journey</div></div>
                      <div class="flex mt-2"><div class="text-2xl">📊</div><div class="ml-3">Add in Google Analytics or any other tracking service using Google Tag Manager</div></div>
                    </div>                </div>
                </div>
            </div>
          </div>
          <!-- <div class="p-4 md:w-1/3">
            <div class="flex rounded-xl h-full bg-base-200 p-4 lg:p-8 flex-col gap-2 items-start">
              <div class="w-12 h-12 bg-accent" style="-webkit-mask-size: 100%; -webkit-mask-image:url(/images/icons/tabler/infinity.svg)"></div>
              <h3 class="text-xl font-semibold mt-2">Unlimited links and features</h3>
                <p class="flex-grow leading-relaxed text-base">No artificial limits on the number of links in your Flow. All marketing features are unlocked, and best of all, free.</p>
                <div class="dropdown">
                  <label tabindex="0" class="btn btn-outline h-8 min-h-8 rounded-full mt-3 inline-flex items-center">Learn more
                    <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="w-4 h-4 ml-2" viewBox="0 0 24 24">
                      <path d="M5 11l7 7 7 -7"></path>
                    </svg>
                  </label>
                  <div tabindex="0" class="dropdown-content menu mt-2 p-6 shadow-xl bg-base-100 rounded-box w-screen max-w-[80vw] md:max-w-md">
                    This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.
                  </div>
                </div>
            </div>
          </div>
          <div class="p-4 md:w-1/3">
            <div class="flex rounded-xl h-full bg-base-200 p-4 lg:p-8 flex-col gap-2 items-start">
              <div class="w-12 h-12 bg-primary" style="-webkit-mask-size: 100%; -webkit-mask-image:url(/images/icons/tabler/player-track-next.svg)"></div>
              <h3 class="text-xl font-semibold mt-2">Free link forwarding</h3>
                <p class="flex-grow leading-relaxed text-base">Unlike other services you might find in a forest, Crowdkit lets you forward from your Crowdkit url directly to anywhere you need.</p>
                <div class="dropdown md:dropdown-end">
                  <label tabindex="0" class="btn btn-outline h-8 min-h-8 rounded-full mt-3 inline-flex items-center">Learn more
                    <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="w-4 h-4 ml-2" viewBox="0 0 24 24">
                      <path d="M5 11l7 7 7 -7"></path>
                    </svg>
                  </label>
                  <div tabindex="0" class="dropdown-content menu mt-2 p-6 shadow-xl bg-base-100 rounded-box w-screen max-w-[80vw] md:max-w-xl">
                    This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.This is a lot more that you can discover by clicking the button above.
                  </div>
                </div>
            </div>
          </div> -->
  
  
        </div>
      </div>
  
  
  
    </section>

      <!-- FAQs -->
      <div class="p-10 bg-base-200 text-base-content pt-20 pb-40">
        <h1 class="text-3xl mb-14 text-center font-semibold">FAQs</h1>
  
        <div tabindex="0" class="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box mt-2">
          <div class="collapse-title text-xl font-medium">
            Where are the nodes hosted?
          </div>
          <div class="collapse-content"> 
            <p>At the moment, all KoinForge infrastructure is in Iowa, North America</p>
          </div>
        </div>
        <div tabindex="0" class="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box mt-2">
          <div class="collapse-title text-xl font-medium">
            I’m currently using a mining pool.  What steps do I have to take to move my VHP onto a private node?
          </div>
          <div class="collapse-content"> 
            <p>First, withdraw your VHP back to your wallet.  Next follow the steps to create the node and link it to your wallet.  Block production will start automatically, and new KOIN will be minted directly into your wallet.</p>
          </div>
        </div>
      </div>



  </div>

</div>

<!-- hide before onMount because modal flashes when loaded with any latency -->
<!-- there’s a larger issue with some styles not being applied before first paint, but this modal is the most noticeable offender -->
{#if timer}
  <PoolCreator bind:this={poolEditor} contractWasmBase64={data.contractWasmBase64}></PoolCreator>
{/if}
<InputsModal bind:this={nodeEditor}
  title="Add a node"
  message="Paste the public key from your node here.  If you’re using the command line, look in .koinos/block_producer/public.key"
  positiveActionName="Add Node"
  buttonAction={addNode}
  schemas={[
    {
      key: "public_key",
      placeholder: "ArdeH...",
      label: "Public key"
    },
    {
      key: "name",
      placeholder: "Cloud node 2",
      label: "Node name"
    }
  ]}
/>
<InputsModal bind:this={poolAdder}
  title="Add an exsiting Fogata pool"
  message="Paste the pool address here."
  positiveActionName="Add Pool"
  buttonAction={addPool}
  schemas={[
    {
      key: "address",
      placeholder: "zgdeH...",
      label: "Pool address"
    }
  ]}
/>

<InputsModal bind:this={confirmModal} title="Are your sure?" message="" positiveActionName="Yes" />
<SelectModal bind:this={nodePicker}
  title="Link your pool with a node"
  message="Linking to a node will allow Koinos to reward your pool for the node’s block production.  This operation will consume mana."
  label="Select your node"
  required={true}
  positiveActionName="Create link"
/>
<style>
</style>
