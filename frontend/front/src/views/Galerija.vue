<template>
  <div class="gallery-page">
    
    <Suspense>
      
      <template #fallback>
        <div>Loading...</div>
      </template>

      <GalleryContent
        :pictures="pictures"
        :currentPage="currentPage"
        :hasMorePages="hasMorePages"
        @changePage="fetchPictures"
        @filterByAuthor="fetchPicturesForAuthor"
      />
    </Suspense>

  </div>
  </template>
  
  <script setup lang="ts">

  import { ref, onMounted, watch } from "vue";
  import { usePictureStore } from "@/stores/pictures";
  import { useRoute, useRouter } from "vue-router";
  import type { Picture } from "@/types/Picture";
  import GalleryContent from "@/components/GalleryContent.vue";
  
  const pictures = ref<Picture[]>([]);
  const currentPage = ref(1);
  const hasMorePages = ref(false);
  const pictureStore = usePictureStore();
  const route = useRoute();
  const router = useRouter();
  
  async function fetchPictures(page = 1) {
    //alert("pozvan fetchPIctures");
    const author = route.query.author as string | undefined;
    const result = await pictureStore.loadAllPictures(page, author);
  
    if (result.success) {
      pictures.value = result.pictures;
      hasMorePages.value = result.hasMorePages;
      currentPage.value = page;
    }
  }
  
  function fetchPicturesForAuthor(author: string) {
    //alert("Pozvana fja");
    router.push({ name: "galerija", query: { ...route.query, author } });
    //fetchPictures(1);
  }

  onMounted(() => {
    fetchPictures();
  });

  watch(() => route.query, () => {
    fetchPictures(1);
  });
  

  </script>
  