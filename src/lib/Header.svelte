<script lang="ts">
  import logo from '$lib/images/koinforge-logotype.svg?raw';
	import Provider from '$lib/Provider.svelte';
  import { SettingsSharp } from 'svelte-ionicons';
  import { rpcs, user } from '$lib/stores'
	import RpcControl from './RpcControl.svelte';
	import { page } from '$app/stores';

</script>


  <div class="px-4 absolute w-full max-w-[1300px] top-4 left-0 right-0 mx-auto">

    <!-- <div class="navbar max-w-[1300px] px-4 py-3 sm:px-6 sm:py-4 lg:py-4 mx-auto rounded-[20px] bg-base-100 shadow-purple-100 dark:shadow-purple-500/30 shadow-md"> -->
    <div class="navbar w-full px-4 py-3 sm:px-6 sm:py-4 lg:py-4 bg-base-100 rounded-[20px]">
        <div class="flex flex-wrap w-full gap-4 justify-between items-center">

        <a class="flex flex-grow items-center gap-1 sm:gap-2" href="/">
          <span class="inline-block w-full max-w-[116px] sm:max-w-[200px]">{@html logo}</span>
          <span class="ml-1 hidden sm:block text-2xl font-semibold"></span>
        </a>

        <div class="flex gap-2 sm:gap-4 justify-end">
          {#if $page.route.id != "/dashboard"}
            <a href="dashboard" class="btn btn-ghost btn-xs sm:btn-sm">Open dashboard</a>
          {/if}
          <Provider />
          <div class="dropdown dropdown-end ">
            <button class="btn btn-ghost btn-xs sm:btn-sm">
              <SettingsSharp size="20" />
            </button>
            <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
            <div tabindex="0" class="dropdown-content menu mt-2 p-2 shadow-lg bg-base-100 dark:bg-base-200 rounded-box w-[250px]">
              <!-- <li><button>Parent menu item</button></li> -->
              <div class="menu-title mt-4 mb-1 pl-4 text-xs font-bold opacity-30">RPC endpoint</div>
              <RpcControl rpcs={rpcs} user={user} />
            </div>
          </div>
        </div>

		  </div>
		</div>
  </div>


<style></style>
